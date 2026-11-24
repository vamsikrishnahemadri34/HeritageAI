import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Image,
  Pressable,
} from "react-native";
import { Text, Searchbar, Chip, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../../src/theme";
import { API_BASE_URL } from "../../src/config/api";

interface HeritageSite {
  id: number;
  name: string;
  description: string;
  category: string;
  location: string;
  state: string;
  country: string;
  historical_period: string | null;
  image_url: string | null;
}

const categories = ["All", "Temple", "Monument", "Fort", "Museum", "Archaeological Site", "Cave", "Historic City", "Stepwell", "Observatory"];

export const siteEditorial: Record<string, { description: string; timeline: { date: string; event: string }[] }> = {
  "Amaravati Stupa": {
    description: "The Amaravati Stupa, also known as the Mahachaitya, was one of the most important Buddhist monuments of ancient India and a major centre of Buddhist learning and pilgrimage. Its origins are traditionally associated with the Mauryan period, while successive Satavahana and later rulers expanded and decorated the monument with intricately carved limestone panels depicting the Buddha, Jataka tales, lotus motifs and scenes from Buddhist life. These sculptures represent a distinctive Amaravati artistic tradition that influenced Buddhist art across the Indian subcontinent and beyond.",
    timeline: [
      { date: "3rd century BCE", event: "Early Buddhist monument established during the Mauryan period." },
      { date: "2nd–1st century BCE", event: "Major enlargement and sculptural development under Satavahana patronage." },
      { date: "1st–3rd century CE", event: "Amaravati school of Buddhist sculpture flourishes." },
      { date: "18th–19th centuries", event: "The site attracts antiquarian attention and archaeological investigation." }
    ]
  },
  "Charminar": {
    description: "Charminar is the defining monument of Hyderabad, built by Muhammad Quli Qutb Shah at the heart of the city he founded. Its four monumental arches and four minarets create a landmark structure that historically connected the city's principal roads and commercial districts. The monument reflects Indo-Islamic architecture with Persian influences and stands amid the historic Laad Bazaar and the Mecca Masjid precinct. It has remained a symbol of Hyderabad's urban identity, cultural exchange and Qutb Shahi heritage for more than four centuries.",
    timeline: [
      { date: "1591", event: "Muhammad Quli Qutb Shah commissions Charminar as the centrepiece of Hyderabad." },
      { date: "Late 16th century", event: "The surrounding city develops as the Qutb Shahi capital." },
      { date: "1687", event: "The Mughal conquest of Golconda brings Qutb Shahi rule to an end." },
      { date: "19th century", event: "Repairs and additions help preserve the monument." }
    ]
  },
  "Golconda Fort": {
    description: "Golconda Fort is a vast hilltop fortress that grew from an early regional stronghold into the powerful capital of the Qutb Shahi dynasty. Its massive granite walls, fortified gateways, royal residences, mosques, audience halls and ingenious acoustic features reveal an advanced approach to military architecture and urban planning. Golconda became internationally famous for its diamond trade, with the wider region associated with celebrated diamonds and global commerce. The fort's layered defences and strategic position tell the story of changing dynasties, political power and the eventual Mughal conquest.",
    timeline: [
      { date: "12th–13th centuries", event: "Early fortifications are associated with the Kakatiya period." },
      { date: "14th century", event: "The fort passes through changing Deccan powers, including the Bahmani Sultanate." },
      { date: "1518", event: "Sultan Quli Qutb-ul-Mulk establishes the Qutb Shahi kingdom." },
      { date: "16th–17th centuries", event: "Golconda expands into a major fortified capital and diamond-trading centre." },
      { date: "1687", event: "Mughal forces under Aurangzeb capture the fort after a prolonged siege." }
    ]
  },
  "Hampi": {
    description: "Hampi preserves the monumental remains of Vijayanagara, once one of the largest and wealthiest cities in the world. Spread across a dramatic landscape of granite hills and the Tungabhadra River, its ruins include royal enclosures, temple complexes, market streets, gateways, water structures and the celebrated stone chariot at the Vittala Temple. The city reached extraordinary prosperity under rulers such as Krishnadevaraya, supported by trade, agriculture, craft production and religious patronage. Its surviving architecture offers an exceptional record of South Indian imperial life before the city was devastated following the Battle of Talikota.",
    timeline: [
      { date: "1336", event: "The Vijayanagara kingdom is traditionally founded by Harihara I and Bukka Raya I." },
      { date: "14th–15th centuries", event: "Hampi develops into a major imperial capital." },
      { date: "1509–1529", event: "Krishnadevaraya's reign marks a celebrated period of expansion and cultural achievement." },
      { date: "1565", event: "The Battle of Talikota is followed by the destruction and decline of the capital." },
      { date: "1986", event: "The Group of Monuments at Hampi is inscribed as a UNESCO World Heritage Site." }
    ]
  },
  "Konark Sun Temple": {
    description: "The Konark Sun Temple is an extraordinary 13th-century monument conceived as the colossal stone chariot of Surya, the Hindu Sun God. Commissioned by King Narasimhadeva I of the Eastern Ganga dynasty, the temple is celebrated for its monumental wheels, richly carved walls, sculptural panels and sophisticated architectural symbolism. Its design represents the Sun God's celestial journey, while its sculptures illuminate religious beliefs, courtly life, music, dance and everyday culture of medieval Odisha. Although much of the original structure is now in ruins, the surviving complex remains one of India's greatest achievements in temple architecture.",
    timeline: [
      { date: "c. 1250 CE", event: "Construction is undertaken under Eastern Ganga ruler Narasimhadeva I." },
      { date: "13th century", event: "The temple becomes a major monument of Odisha's temple-building tradition." },
      { date: "Later centuries", event: "The main sanctuary deteriorates and the complex loses much of its original form." },
      { date: "1900s", event: "Conservation work, including the filling of the main tower, helps stabilise the structure." },
      { date: "1984", event: "The Sun Temple is inscribed as a UNESCO World Heritage Site." }
    ]
  },
  "Lepakshi Veerabhadra Temple": {
    description: "The Veerabhadra Temple at Lepakshi is a celebrated example of Vijayanagara-era architecture in Andhra Pradesh. Built on a low rocky hill, the complex is renowned for its ornate pillars, elaborate ceiling paintings, sculpted halls and the monumental Nandi statue located nearby. Its principal shrine is dedicated to Veerabhadra, a fierce form of Shiva, and the temple's visual programme combines mythology, devotion and royal-era craftsmanship. The famous hanging pillar, which appears to rest without fully touching the floor, is among the site's most discussed architectural features.",
    timeline: [
      { date: "16th century", event: "The temple complex is developed during the Vijayanagara period." },
      { date: "Reign of Achyuta Deva Raya (1529–1542)", event: "Local tradition associates major construction with royal officials Virupanna and Viranna." },
      { date: "16th century", event: "The temple's sculptural and painted decorations reflect Vijayanagara artistic traditions." },
      { date: "Later centuries", event: "The complex remains an important regional place of worship and heritage." }
    ]
  },
  "Sanchi Stupa": {
    description: "The Great Stupa at Sanchi is among the oldest surviving stone structures in India and one of the most important monuments of Buddhist heritage. Its earliest core was commissioned by Emperor Ashoka, while later dynasties enlarged the structure and added the richly carved gateways known as toranas. These gateways narrate episodes from the Buddha's life and Jataka stories through symbolic imagery, including the Bodhi tree, footprints and the Dharma wheel. Together with surrounding monasteries, temples and smaller stupas, Sanchi provides an exceptional record of Buddhist religious art, architecture and pilgrimage over many centuries.",
    timeline: [
      { date: "3rd century BCE", event: "Emperor Ashoka commissions the original stupa." },
      { date: "2nd–1st century BCE", event: "The stupa is enlarged and encased in stone during the Shunga period." },
      { date: "1st century BCE–1st century CE", event: "The four elaborately carved gateways are added." },
      { date: "1818", event: "The monument is brought to wider modern attention by British officer Henry Taylor." },
      { date: "1989", event: "The Buddhist Monuments at Sanchi become a UNESCO World Heritage Site." }
    ]
  },
  "Taj Mahal": {
    description: "The Taj Mahal is a monumental mausoleum commissioned by Mughal emperor Shah Jahan in memory of his wife Mumtaz Mahal. Built in white marble on the banks of the Yamuna River, the complex combines Persian, Islamic, Indian and Timurid architectural traditions in a carefully planned composition of a central tomb, four minarets, gardens, gateways, a mosque and a guest pavilion. Its symmetrical design, calligraphy, pietra dura inlay and changing appearance under different light conditions have made it one of the most recognised works of architecture in the world. The monument also reflects the artistic resources and imperial ambitions of the Mughal court at its height.",
    timeline: [
      { date: "1631", event: "Mumtaz Mahal dies; Shah Jahan commissions her mausoleum." },
      { date: "1632", event: "Construction of the Taj Mahal complex begins." },
      { date: "1648", event: "The principal mausoleum is substantially completed." },
      { date: "c. 1653", event: "The wider complex and finishing works are completed." },
      { date: "1983", event: "The Taj Mahal is inscribed as a UNESCO World Heritage Site." }
    ]
  },
  "Red Fort": {
    description: "The Red Fort, or Lal Qila, was built by Mughal emperor Shah Jahan as the ceremonial and administrative heart of his new capital, Shahjahanabad. Constructed primarily in red sandstone, the fort contains palaces, audience halls, gardens, gates and defensive walls. Its architecture reflects Mughal court culture and the political history of Delhi. The fort later became a powerful symbol of India's modern national story, with the Prime Minister addressing the nation from its ramparts on Independence Day.",
    timeline: [
      { date: "1638", event: "Shah Jahan orders the construction of a new Mughal capital at Shahjahanabad." },
      { date: "1648", event: "The Red Fort is substantially completed and becomes the imperial residence." },
      { date: "1857", event: "The uprising leads to the end of Mughal rule and major changes to the fort's use." },
      { date: "1947", event: "The first Prime Minister of independent India raises the national flag at the fort." },
      { date: "2007", event: "The Red Fort is inscribed as a UNESCO World Heritage Site." },
    ],
  },
  "Qutub Minar": {
    description: "Qutub Minar is the celebrated tower at the centre of the Qutb complex in Delhi. Begun by Qutb al-Din Aibak and continued by Iltutmish, the minaret is built of red sandstone and marble and decorated with bands of inscriptions and geometric ornament. The wider complex includes the Quwwat-ul-Islam Mosque, the Iron Pillar and later Sultanate structures, offering a record of the early Delhi Sultanate and the development of Indo-Islamic architecture.",
    timeline: [
      { date: "c. 1199", event: "Qutb al-Din Aibak begins construction of the minaret." },
      { date: "Early 13th century", event: "Iltutmish adds further storeys and develops the complex." },
      { date: "14th century", event: "Repairs and additions are undertaken after damage from lightning." },
      { date: "19th–20th centuries", event: "The complex receives archaeological attention and conservation." },
      { date: "1993", event: "The Qutb Minar and its Monuments are inscribed as a UNESCO World Heritage Site." },
    ],
  },
  "Ajanta Caves": {
    description: "The Ajanta Caves are a remarkable series of Buddhist rock-cut sanctuaries excavated into a horseshoe-shaped gorge in Maharashtra. The complex includes monasteries and prayer halls decorated with sculptures and paintings. The murals, many depicting stories from the Buddha's previous births and episodes from Buddhist tradition, are among the finest surviving examples of ancient Indian painting. Ajanta provides an exceptional record of Buddhist patronage, artistic practice and monastic life across different periods.",
    timeline: [
      { date: "2nd–1st centuries BCE", event: "The earliest caves are excavated during the Satavahana period." },
      { date: "5th–6th centuries CE", event: "A major phase of cave excavation and painting takes place under Vakataka patronage." },
      { date: "7th century onward", event: "The site gradually declines as an active monastic centre." },
      { date: "1819", event: "The caves are brought to wider modern attention by a British officer." },
      { date: "1983", event: "Ajanta Caves are inscribed as a UNESCO World Heritage Site." },
    ],
  },
  "Ellora Caves": {
    description: "The Ellora Caves form one of India's most extraordinary rock-cut architectural complexes. Set into the Charanandri hills, the caves include Buddhist monasteries, Hindu temples and Jain sanctuaries created over several centuries. The monumental Kailasa temple, carved from a single rock mass, demonstrates extraordinary planning and craftsmanship. Ellora is especially significant because its monuments preserve evidence of multiple religious traditions flourishing in the same regional landscape.",
    timeline: [
      { date: "6th–7th centuries", event: "Early Buddhist caves are excavated at Ellora." },
      { date: "7th–9th centuries", event: "Major Hindu monuments, including the Kailasa temple, are created." },
      { date: "9th–10th centuries", event: "Jain caves and later sculptural works are developed." },
      { date: "19th century", event: "Systematic archaeological documentation increases." },
      { date: "1983", event: "Ellora Caves are inscribed as a UNESCO World Heritage Site." },
    ],
  },
  "Fatehpur Sikri": {
    description: "Fatehpur Sikri was established by Mughal emperor Akbar as an imperial capital. Built largely in red sandstone, the planned city includes palaces, courtyards, audience halls, religious buildings and monumental gateways. Its architecture brings together influences from different regions and traditions of the Mughal empire. Although the capital was occupied for a relatively short period, its remarkably preserved buildings provide insight into Akbar's court, administration and cultural vision.",
    timeline: [
      { date: "c. 1571", event: "Akbar begins developing Fatehpur Sikri as an imperial capital." },
      { date: "1570s", event: "Major palaces, audience halls and religious structures are constructed." },
      { date: "Late 16th century", event: "The imperial court shifts away from the city." },
      { date: "19th–20th centuries", event: "Conservation and archaeological study document the complex." },
      { date: "1986", event: "Fatehpur Sikri is inscribed as a UNESCO World Heritage Site." },
    ],
  },
  "Khajuraho Temples": {
    description: "The Khajuraho group of temples was built under the Chandela dynasty and is celebrated for its refined Nagara-style architecture and intricate sculptural decoration. The surviving Hindu and Jain temples feature soaring shikharas, richly carved walls and detailed images of deities, celestial beings, musicians and everyday life. Their sculpture forms part of a broader sacred and architectural programme, making Khajuraho an important record of medieval central Indian art and religious culture.",
    timeline: [
      { date: "c. 950", event: "The major period of Chandela temple building begins." },
      { date: "10th–11th centuries", event: "Many of the surviving temples are constructed and decorated." },
      { date: "13th century onward", event: "The region's political and religious landscape changes and the complex receives less royal patronage." },
      { date: "19th century", event: "The temples are documented in modern surveys." },
      { date: "1986", event: "The Khajuraho Group of Monuments is inscribed as a UNESCO World Heritage Site." },
    ],
  },
  "Brihadeeswarar Temple": {
    description: "Brihadeeswarar Temple at Thanjavur is one of the great achievements of Chola architecture. Commissioned by Rajaraja I and dedicated to Shiva, the temple is distinguished by its immense vimana, carefully proportioned granite construction, sculptural details and extensive inscriptions. These inscriptions record donations, temple administration, performers and religious activities, making the monument an important historical source as well as a place of worship.",
    timeline: [
      { date: "c. 1003", event: "Construction is undertaken under Chola emperor Rajaraja I." },
      { date: "1010", event: "The temple is consecrated and becomes a major royal religious centre." },
      { date: "11th–13th centuries", event: "Chola rulers continue to patronise and enrich the temple." },
      { date: "Later centuries", event: "The temple remains an important centre of worship and regional heritage." },
      { date: "1987", event: "The Great Living Chola Temples are inscribed as a UNESCO World Heritage Site; the group is extended in 2004." },
    ],
  },
  "Meenakshi Amman Temple": {
    description: "The Meenakshi Amman Temple is the historic heart of Madurai and a major centre of Tamil religious and cultural life. Dedicated to Meenakshi and Sundareshwarar, the complex is known for its monumental gopurams, pillared halls, sculptural decoration and sacred tank. The temple took shape over many centuries, with major expansions under the Nayak rulers. Its architecture, festivals and living traditions continue to shape the identity of Madurai.",
    timeline: [
      { date: "Early medieval period", event: "The temple's older traditions and shrines develop in Madurai." },
      { date: "13th century", event: "The complex experiences disruption during political upheavals in the region." },
      { date: "16th–17th centuries", event: "Nayak rulers undertake major rebuilding and expansion." },
      { date: "17th century", event: "The monumental halls and gopurams take much of their present form." },
      { date: "Present day", event: "The temple remains an active centre of worship, festivals and cultural life." },
    ],
  },
  "Rani ki Vav": {
    description: "Rani ki Vav is an elaborate stepwell at Patan, commissioned by Queen Udayamati in memory of King Bhima I of the Solanki dynasty. Designed as a subterranean architectural structure, it descends through multiple levels of pillared pavilions and richly carved walls. Its sculptures include deities and mythological figures, demonstrating how practical water architecture could also express religious ideas and royal patronage.",
    timeline: [
      { date: "11th century", event: "Queen Udayamati commissions the stepwell in memory of Bhima I." },
      { date: "Medieval period", event: "The stepwell is gradually buried, helping protect much of its sculptural detail." },
      { date: "1980s", event: "Archaeological conservation and excavation bring the monument to wider attention." },
      { date: "2014", event: "Rani ki Vav is inscribed as a UNESCO World Heritage Site." },
    ],
  },
  "Jantar Mantar": {
    description: "The Jantar Mantar in Jaipur is an early modern astronomical observatory commissioned by Maharaja Sawai Jai Singh II. Its large masonry instruments were designed to observe celestial positions, measure time and support astronomical calculations. The observatory reflects the ruler's interest in astronomy and scientific knowledge, combining observational traditions with monumental architecture. Its instruments remain an important example of scientific heritage in India.",
    timeline: [
      { date: "1720s", event: "Sawai Jai Singh II establishes a programme of observatory construction." },
      { date: "1734", event: "The Jaipur observatory is completed in its principal form." },
      { date: "18th century", event: "Astronomers use the instruments for observations and calculations." },
      { date: "20th century", event: "Conservation work helps preserve the instruments." },
      { date: "2010", event: "The Jantar Mantar, Jaipur, is inscribed as a UNESCO World Heritage Site." },
    ],
  },
  "Mahabalipuram Monuments": {
    description: "The monuments at Mahabalipuram, also known as Mamallapuram, preserve the artistic achievements of the Pallava dynasty. The coastal complex includes rock-cut caves, monolithic rathas, sculpted reliefs and structural temples, including the Shore Temple overlooking the Bay of Bengal. Their varied forms reveal experimentation in stone architecture and the development of temple design in South India.",
    timeline: [
      { date: "7th century", event: "Pallava rulers begin major rock-cut and monolithic monuments." },
      { date: "Late 7th century", event: "The Shore Temple and other structural works are developed." },
      { date: "8th century", event: "Sculptural and architectural activity continues under Pallava patronage." },
      { date: "Later centuries", event: "The monuments become a landmark of the Coromandel coast." },
      { date: "1984", event: "The Group of Monuments at Mahabalipuram is inscribed as a UNESCO World Heritage Site." },
    ],
  },
  "Victoria Memorial": {
    description: "The Victoria Memorial is a monumental marble building in Kolkata conceived in memory of Queen Victoria. Designed by William Emerson, it combines European architectural forms with elements inspired by Mughal design. Construction began during the British colonial period and the building later became a museum and cultural institution, housing collections related to the history of India and the colonial era.",
    timeline: [
      { date: "1901", event: "The death of Queen Victoria leads to proposals for a memorial in India." },
      { date: "1906", event: "The foundation stone is laid in Kolkata." },
      { date: "1921", event: "The Victoria Memorial is formally opened to the public." },
      { date: "Post-independence", event: "The memorial continues as a museum and public heritage institution." },
      { date: "Present day", event: "Its galleries and grounds remain a major cultural destination in Kolkata." },
    ],
  },
};

export default function ExploreScreen() {
  const router = useRouter();
  const [sites, setSites] = useState<HeritageSite[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [state, setState] = useState("All India");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadSites = useCallback(async () => {
    try {
      setError("");
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (search.trim()) params.set("search", search.trim());
      const response = await fetch(`${API_BASE_URL}/heritage/sites/?${params.toString()}`);
      if (!response.ok) throw new Error("Unable to load heritage sites");
      const data: HeritageSite[] = await response.json();
      setSites(data);
    } catch {
      setError("Could not connect to HeritageAI. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => loadSites(), 300);
    return () => clearTimeout(timer);
  }, [loadSites]);

  const states = useMemo(
    () => ["All India", ...Array.from(new Set(sites.map((site) => site.state))).sort()],
    [sites]
  );

  const filteredSites = useMemo(
    () => sites.filter((site) => {
      const categoryMatch = category === "All" || site.category.toLowerCase() === category.toLowerCase();
      const stateMatch = state === "All India" || site.state === state;
      return categoryMatch && stateMatch;
    }),
    [sites, category, state]
  );

  const openSite = (id: number) => router.push({ pathname: "/site/[id]", params: { id: String(id) } });

  const renderSite = ({ item }: { item: HeritageSite }) => (
    <Pressable style={styles.card} onPress={() => openSite(item.id)}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url.replace("http://10.106.37.61:8000", API_BASE_URL) }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.placeholderText}>HeritageAI</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.siteName} numberOfLines={2}>{item.name}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredSites}
        key="two-column-sites"
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSite}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadSites(); }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>HERITAGEAI • DISCOVER INDIA</Text>
              <Text variant="headlineLarge" style={styles.heading}>Explore Heritage</Text>
              <Text style={styles.subtitle}>Every monument has a story. Discover the places that shaped our history.</Text>
            </View>
            <Searchbar
              placeholder="Search monuments, temples, places..."
              value={search}
              onChangeText={setSearch}
              style={styles.search}
              inputStyle={styles.searchInput}
              iconColor={colors.primary}
              elevation={0}
            />
            <View style={styles.statsRow}>
              <View style={styles.statCard}><Text style={styles.statNumber}>{sites.length}</Text><Text style={styles.statLabel}>HERITAGE SITES</Text></View>
              <View style={styles.statCard}><Text style={styles.statNumber}>{states.length - 1}</Text><Text style={styles.statLabel}>STATES</Text></View>
              <View style={styles.statCard}><Text style={styles.statNumber}>{new Set(sites.map((site) => site.category)).size}</Text><Text style={styles.statLabel}>CATEGORIES</Text></View>
            </View>
            <Text style={styles.sectionTitle}>Explore by category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {categories.map((item) => (
                <Chip key={item} selected={category === item} onPress={() => setCategory(item)} compact
                  style={[styles.filterChip, category === item && styles.selectedFilter]}
                  textStyle={[styles.filterText, category === item && styles.selectedFilterText]} showSelectedCheck={false}>{item}</Chip>
              ))}
            </ScrollView>
            <Text style={styles.sectionTitle}>Discover by state</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {states.map((item) => (
                <Chip key={item} selected={state === item} onPress={() => setState(item)} compact
                  style={[styles.filterChip, state === item && styles.selectedFilter]}
                  textStyle={[styles.filterText, state === item && styles.selectedFilterText]} showSelectedCheck={false}>{item}</Chip>
              ))}
            </ScrollView>
            <View style={styles.resultsHeading}>
              <Text style={styles.sectionTitle}>Heritage collection</Text>
              <Text style={styles.resultCount}>{filteredSites.length} places</Text>
            </View>
            {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.emptyText}>Discovering heritage sites...</Text></View> : null}
            {!loading && error ? <View style={styles.center}><Text style={styles.error}>{error}</Text><Pressable onPress={loadSites} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable></View> : null}
            {!loading && !error && filteredSites.length === 0 ? <View style={styles.center}><Text style={styles.emptyTitle}>No discoveries found</Text><Text style={styles.emptyText}>Try another search, category, or state.</Text></View> : null}
          </View>
        }
        ListEmptyComponent={loading || error ? undefined : <Text style={styles.endText}>No heritage sites found.</Text>}
        ListFooterComponent={<View style={{ height: 30 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 10, paddingBottom: 20 },
  row: { justifyContent: "space-between" },
  header: { paddingTop: 25, paddingHorizontal: 10, marginBottom: 18 },
  eyebrow: { color: colors.secondary, fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 9 },
  heading: { color: colors.primary, fontWeight: "800", letterSpacing: -1 },
  subtitle: { color: colors.muted, marginTop: 8, fontSize: 14, lineHeight: 22 },
  search: { marginHorizontal: 5, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  searchInput: { fontSize: 14 },
  statsRow: { flexDirection: "row", marginHorizontal: 5, marginTop: 18, marginBottom: 26, gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  statNumber: { color: colors.primary, fontSize: 23, fontWeight: "800" },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 0.7, marginTop: 4, textAlign: "center" },
  sectionTitle: { color: colors.primary, fontSize: 19, fontWeight: "800", paddingHorizontal: 10, marginBottom: 12 },
  filters: { paddingHorizontal: 5, paddingBottom: 22, gap: 8 },
  filterChip: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  selectedFilter: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.primary, fontSize: 12 },
  selectedFilterText: { color: "#FFFFFF" },
  resultsHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 3 },
  resultCount: { color: colors.muted, fontSize: 12, marginRight: 10, marginBottom: 12 },
  card: { flex: 1, marginHorizontal: 5, marginBottom: 14, backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  cardImage: { width: "100%", height: 155, backgroundColor: "#EAE5D9" },
  cardImagePlaceholder: { height: 155, backgroundColor: "#EAE5D9", justifyContent: "center", alignItems: "center" },
  placeholderText: { color: colors.primary, fontFamily: "Georgia", fontSize: 20 },
  cardContent: { paddingHorizontal: 12, paddingVertical: 13, minHeight: 62, justifyContent: "center" },
  siteName: { color: colors.primary, fontWeight: "800", fontFamily: "Georgia", fontSize: 16, lineHeight: 21 },
  center: { padding: 30, alignItems: "center", justifyContent: "center", gap: 12 },
  error: { color: colors.danger, textAlign: "center" },
  retryButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: "#FFFFFF", fontWeight: "700" },
  emptyTitle: { color: colors.primary, fontSize: 17, fontWeight: "800" },
  emptyText: { color: colors.muted, textAlign: "center", fontSize: 13 },
  endText: { color: colors.muted, textAlign: "center", padding: 20 },
});
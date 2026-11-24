import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Appbar, Text } from "react-native-paper";
import { colors } from "../../src/theme";
import { API_BASE_URL } from "../../src/config/api";
import { siteEditorial } from "../(tabs)/explore";

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

const IMAGE_CREDITS: Record<number, { author: string; license: string; source: string }> = {
  3: {
    author: "Yann, edited by King of Hearts",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Taj_Mahal,_Agra,_India_edit2.jpg",
  },
  4: {
    author: "Subhrajyoti07",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Sun_Temple_Main_Structure,_Konark,_Orissa.jpg",
  },
  5: {
    author: "Joydeep",
    license: "CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Charminar_12032013.jpg",
  },
  6: {
    author: "Pallav Singhal",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Buddhist_Monuments_at_Sanchi,_Bhopal.jpg",
  },
  7: {
    author: "Abheesta Gangapuram",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Hampi_monuments.jpg",
  },
  8: {
    author: "Bernard Gagnon",
    license: "CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Golconda_Fort_008.jpg",
  },
  9: {
    author: "Nagesh Kamath",
    license: "CC BY-SA 2.0",
    source: "https://commons.wikimedia.org/wiki/File:AP_Lepakshi_Veerabhadra_Temple.jpg",
  },
  10: {
    author: "Bhaskaranaidu",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Amaravati_stupa._at_Amaravati.main_stupa.JPG",
  },
};

export default function HeritageSiteDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [site, setSite] = useState<HeritageSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSite() {
      try {
        setError("");
        const response = await fetch(`${API_BASE_URL}/heritage/sites/${id}`);
        if (!response.ok) throw new Error("Unable to load this heritage site.");
        const data: HeritageSite = await response.json();
        if (active) setSite(data);
      } catch {
        if (active) setError("Could not load heritage site details. Check your connection.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) loadSite();
    return () => {
      active = false;
    };
  }, [id]);

  const openGoogleMaps = () => {
    if (!site) return;
    const query = encodeURIComponent(
      `${site.name}, ${site.location}, ${site.state}, ${site.country}`
    );
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const editorial = site ? siteEditorial[site.name] : undefined;
  const description = editorial?.description ?? site?.description;
  const timeline = editorial?.timeline ?? [];

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Heritage Details" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>Loading heritage story...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : site ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {site.image_url ? (
            <Image source={{ uri: site.image_url.replace("http://10.106.37.61:8000", API_BASE_URL) }} style={styles.heroImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>HeritageAI</Text>
            </View>
          )}

          <View style={styles.intro}>
            <Text style={styles.eyebrow}>{site.category.toUpperCase()}</Text>
            <Text style={styles.title}>{site.name}</Text>
            <View style={styles.addressRow}>
              <Text style={styles.addressIcon}>⌖</Text>
              <Text style={styles.address}>
                {site.location}, {site.state}, {site.country}
              </Text>
            </View>
            {site.historical_period ? (
              <Text style={styles.period}>{site.historical_period}</Text>
            ) : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>THE STORY</Text>
            <Text style={styles.sectionTitle}>About this heritage site</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          {timeline.length > 0 ? (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionEyebrow}>THROUGH THE AGES</Text>
                <Text style={styles.sectionTitle}>Historical timeline</Text>
                <View style={styles.timeline}>
                  {timeline.map((event, index) => (
                    <View key={`${site.id}-timeline-${index}`} style={styles.timelineRow}>
                      <View style={styles.markerColumn}>
                        <View style={styles.timelineDot} />
                        {index < timeline.length - 1 ? (
                          <View style={styles.timelineLine} />
                        ) : null}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineDate}>{event.date}</Text>
                        <Text style={styles.timelineEvent}>{event.event}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : null}

          {site.image_url && IMAGE_CREDITS[site.id] ? (
            <View style={styles.credits}>
              <Text style={styles.creditsTitle}>Image credits</Text>
              <Text style={styles.creditsText}>
                Photograph by {IMAGE_CREDITS[site.id].author}
              </Text>
              <Text style={styles.creditsText}>
                Licence: {IMAGE_CREDITS[site.id].license}
              </Text>
              <Pressable onPress={() => Linking.openURL(IMAGE_CREDITS[site.id].source)}>
                <Text style={styles.creditsLink}>View original source on Wikimedia Commons</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable style={styles.mapButton} onPress={openGoogleMaps}>
            <Text style={styles.mapButtonIcon}>↗</Text>
            <Text style={styles.mapButtonText}>OPEN IN GOOGLE MAPS</Text>
          </Pressable>
          <Text style={styles.mapCaption}>Explore this heritage site on the map</Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    elevation: 0,
  },
  headerTitle: {
    color: colors.primary,
    fontWeight: "700",
  },
  content: {
    paddingBottom: 38,
  },
  heroImage: {
    width: "100%",
    height: 290,
    backgroundColor: "#EAE5D9",
  },
  imagePlaceholder: {
    height: 260,
    backgroundColor: "#EAE5D9",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontSize: 30,
  },
  intro: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 8,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    gap: 8,
  },
  addressIcon: {
    color: colors.secondary,
    fontSize: 19,
    marginTop: -2,
  },
  address: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  period: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 22,
    marginVertical: 20,
  },
  section: {
    paddingHorizontal: 22,
  },
  sectionEyebrow: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 7,
  },
  sectionTitle: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontSize: 23,
    fontWeight: "700",
    marginBottom: 13,
  },
  description: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 27,
  },
  timeline: {
    marginTop: 7,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 65,
  },
  markerColumn: {
    width: 19,
    alignItems: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
    marginTop: 4,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 17,
  },
  timelineDate: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  timelineEvent: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  credits: {
    backgroundColor: "#F0EBDD",
    marginHorizontal: 22,
    marginTop: 20,
    padding: 17,
    borderRadius: 16,
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  creditsTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  creditsText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  creditsLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
    marginTop: 5,
  },
  mapButton: {
    marginHorizontal: 22,
    marginTop: 28,
    paddingVertical: 17,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  mapButtonIcon: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  mapButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  mapCaption: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 11,
    marginTop: 9,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  statusText: {
    color: colors.muted,
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
    lineHeight: 24,
  },
});

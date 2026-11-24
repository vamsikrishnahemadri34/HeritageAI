import { ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Text, Surface } from "react-native-paper";
import { colors, spacing, radius } from "../../src/theme";

const features = [
  {
    icon: "⌖",
    number: "01",
    title: "Explore Heritage",
    description: "Discover remarkable monuments and lost civilizations.",
  },
  {
    icon: "✧",
    number: "02",
    title: "AI Heritage Guide",
    description: "Uncover the stories and meaning behind history.",
  },
  {
    icon: "⌁",
    number: "03",
    title: "Inscription Reader",
    description: "Read and understand ancient inscriptions.",
  },
  {
    icon: "◈",
    number: "04",
    title: "Restore History",
    description: "Experience AI-powered historical image restoration.",
  },
];

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>THE WORLD'S CULTURAL LEGACY</Text>
          <Text style={styles.brand}>HeritageAI</Text>
          <Text style={styles.subtitle}>
            Discover the stories that shaped our world.
          </Text>
        </View>
        <View style={styles.headerMark}>
          <Text style={styles.headerMarkText}>H</Text>
        </View>
      </View>

      <Surface style={styles.hero} elevation={0}>
        <View style={styles.heroTop}>
          <Text style={styles.heroEyebrow}>A JOURNEY THROUGH TIME</Text>
          <Text style={styles.heroSymbol}>✳</Text>
        </View>

        <View style={styles.heroDivider} />

        <Text style={styles.heroTitle}>
          Every monument{ "\n" }has a story.
        </Text>

        <Text style={styles.heroDescription}>
          Step into the past. Discover extraordinary places, understand
          ancient cultures and preserve the stories of our shared heritage.
        </Text>

        <View style={styles.heroBottom}>
          <Text style={styles.heroTag}>DISCOVER  ·  PRESERVE  ·  CONNECT</Text>
          <Text style={styles.heroArrow}>↗</Text>
        </View>
      </Surface>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>YOUR EXPERIENCE</Text>
          <Text style={styles.sectionTitle}>Explore HeritageAI</Text>
        </View>
        <Text style={styles.sectionCount}>04 FEATURES</Text>
      </View>

      <View style={styles.grid}>
        {features.map((feature) => (
          <Surface key={feature.number} style={styles.feature} elevation={0}>
            <View style={styles.featureTop}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <Text style={styles.featureNumber}>{feature.number}</Text>
            </View>

            <View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </View>

            <View style={styles.featureBottom}>
              <View style={styles.featureAccent} />
              <Text style={styles.featureArrow}>↗</Text>
            </View>
          </Surface>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>MADE TO PRESERVE HISTORY</Text>
        <View style={styles.footerLine} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 62,
    paddingBottom: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2.4,
    color: colors.secondary,
    fontWeight: "800",
  },
  brand: {
    fontFamily: "Georgia",
    fontSize: 36,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 7,
    letterSpacing: -1.2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
  },
  headerMark: {
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerMarkText: {
    fontFamily: "Georgia",
    color: colors.primary,
    fontSize: 23,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: 25,
    marginBottom: 34,
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroEyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "700",
    color: "#D8C39E",
  },
  heroSymbol: {
    fontSize: 25,
    color: "#C7A873",
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#52665A",
    marginTop: 17,
    marginBottom: 24,
  },
  heroTitle: {
    fontFamily: "Georgia",
    fontSize: 34,
    lineHeight: 43,
    color: "#FFFDF7",
    fontWeight: "700",
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 22,
    color: "#D8E0D8",
    marginTop: 15,
  },
  heroBottom: {
    borderTopWidth: 1,
    borderTopColor: "#52665A",
    marginTop: 24,
    paddingTop: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTag: {
    color: "#E5D0A9",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  heroArrow: {
    color: "#E5D0A9",
    fontSize: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  sectionEyebrow: {
    color: colors.secondary,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "800",
  },
  sectionTitle: {
    fontFamily: "Georgia",
    fontSize: 23,
    color: colors.primary,
    fontWeight: "700",
    marginTop: 5,
  },
  sectionCount: {
    color: colors.muted,
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  feature: {
    width: "48%",
    flexGrow: 1,
    minHeight: 190,
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 19,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1EBDD",
    alignItems: "center",
    justifyContent: "center",
  },
  featureIcon: {
    color: colors.primary,
    fontSize: 25,
  },
  featureNumber: {
    color: colors.secondary,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
  },
  featureTitle: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontSize: 16,
    fontWeight: "700",
  },
  featureDescription: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },
  featureBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 17,
  },
  featureAccent: {
    width: 28,
    height: 2,
    backgroundColor: colors.secondary,
  },
  featureArrow: {
    fontSize: 17,
    color: colors.secondary,
  },
  footer: {
    marginTop: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  footerText: {
    color: colors.muted,
    fontSize: 8,
    letterSpacing: 1.5,
  },
});

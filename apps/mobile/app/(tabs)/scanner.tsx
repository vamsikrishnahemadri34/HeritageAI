import { useState } from "react";
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Text, Button, Surface, ActivityIndicator } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { colors, spacing } from "../../src/theme";
import { scanInscription, translateInscription, OCRResult } from "../../src/services/scanner";
import { saveScanHistory, updateScanTranslation } from "../../src/services/scanHistory";

export default function ScannerScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showingTranslation, setShowingTranslation] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Auto Detect");
  const [scanHistoryId, setScanHistoryId] = useState<number | null>(null);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera permission required",
        "Allow camera access to scan heritage objects."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setOcrResult(null);
      setTranslatedText(null);
      setShowingTranslation(false);
    }
  };

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setOcrResult(null);
      setTranslatedText(null);
      setShowingTranslation(false);
    }
  };

  const handleTranslation = async () => {
    if (!ocrResult?.extracted_text) return;

    if (showingTranslation) {
      setShowingTranslation(false);
      return;
    }

    if (translatedText) {
      setShowingTranslation(true);
      return;
    }

    setTranslating(true);

    try {
      const result = await translateInscription(
        ocrResult.extracted_text,
        selectedLanguage === "Auto Detect" ? ocrResult.language : selectedLanguage
      );
      setTranslatedText(result);
      setShowingTranslation(true);
      if (scanHistoryId !== null) {
        try {
          await updateScanTranslation(scanHistoryId, result);
        } catch (error) {
          console.warn("Could not update saved translation:", error);
        }
      }
    } catch (error) {
      Alert.alert(
        "Translation failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setTranslating(false);
    }
  };

  const retryTranslation = async () => {
    if (!ocrResult?.extracted_text) return;

    setTranslating(true);
    setTranslatedText(null);
    setShowingTranslation(false);

    try {
      const result = await translateInscription(
        ocrResult.extracted_text,
        selectedLanguage === "Auto Detect" ? ocrResult.language : selectedLanguage
      );
      setTranslatedText(result);
      setShowingTranslation(true);
      if (scanHistoryId !== null) {
        try {
          await updateScanTranslation(scanHistoryId, result);
        } catch (error) {
          console.warn("Could not update saved translation:", error);
        }
      }
    } catch (error) {
      Alert.alert(
        "Translation failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setTranslating(false);
    }
  };
  const analyzeImage = async () => {
    if (!imageUri) return;

    setScanning(true);
    setOcrResult(null);
    setTranslatedText(null);
    setShowingTranslation(false);

    try {
      const result = await scanInscription(imageUri);
      setOcrResult(result);
      setScanHistoryId(null);

      if (result.extracted_text.trim()) {
        try {
          const saved = await saveScanHistory({
            filename: result.filename || "inscription-scan",
            language: result.language || "Unknown",
            extracted_text: result.extracted_text,
            translated_text: null,
            word_count: result.word_count,
          });
          setScanHistoryId(saved.id);
        } catch (error) {
          console.warn("Could not save scan history:", error);
        }
      }
    } catch (error) {
      Alert.alert(
        "Scanning failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setScanning(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text variant="headlineMedium" style={styles.heading}>
        Heritage Scanner
      </Text>

      <Text style={styles.subtitle}>
        Discover the history behind monuments, sculptures, inscriptions and
        historical objects.
      </Text>

      <Surface style={styles.uploadCard} elevation={1}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.scanIcon}>?</Text>
            <Text variant="titleMedium" style={styles.placeholderTitle}>
              Scan a Heritage Object
            </Text>
            <Text style={styles.helper}>
              Take a photo or choose an image from your gallery.
            </Text>
          </View>
        )}
      </Surface>

      <Button
        mode="contained"
        icon="camera"
        onPress={takePhoto}
        disabled={scanning}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Take Photo
      </Button>

      <Button
        mode="outlined"
        icon="image"
        onPress={chooseImage}
        disabled={scanning}
        style={styles.button}
        contentStyle={styles.buttonContent}
        textColor={colors.primary}
      >
        Choose from Gallery
      </Button>

      {imageUri && (
        <>
          <Button
            mode="contained"
            icon="text-recognition"
            onPress={analyzeImage}
            loading={scanning}
            disabled={scanning}
            style={styles.analyzeButton}
            contentStyle={styles.buttonContent}
          >
            {scanning ? "Extracting Text..." : "Extract Inscription Text"}
          </Button>

          <Button
            mode="text"
            disabled={scanning}
            onPress={() => {
              setImageUri(null);
              setOcrResult(null);
              setTranslatedText(null);
              setShowingTranslation(false);
      setTranslatedText(null);
      setShowingTranslation(false);
            }}
            textColor={colors.danger}
          >
            Remove Image
          </Button>
        </>
      )}

      {scanning && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.helper}>Reading inscription...</Text>
        </View>
      )}

      {ocrResult && (
        <>
          <Text variant="titleMedium" style={styles.resultHeading}>
            Source Language
          </Text>
          <View style={styles.languageOptions}>
            {["Auto Detect", "Hindi", "Sanskrit", "Telugu", "English"].map((language) => (
              <Button
                key={language}
                compact
                mode={selectedLanguage === language ? "contained" : "outlined"}
                onPress={() => {
                  setSelectedLanguage(language);
                  setTranslatedText(null);
                  setShowingTranslation(false);
                }}
              >
                {language}
              </Button>
            ))}
          </View>
          <Surface style={styles.resultCard} elevation={1}>
          <View style={styles.resultHeader}>
            <Text variant="titleLarge" style={styles.resultHeading}>
              Extracted Text
            </Text>
            <Button
              mode="outlined"
              compact
              onPress={handleTranslation}
              loading={translating}
              disabled={translating || !ocrResult.extracted_text}
              style={styles.translateButton}
              labelStyle={styles.translateButtonLabel}
            >
              {showingTranslation ? "Show Original" : "Translate to English"}
            </Button>
            {translatedText && (
              <Button
                mode="text"
                compact
                onPress={retryTranslation}
                loading={translating}
                disabled={translating}
              >
                Retry Translation
              </Button>
            )}
          </View>

          <Text style={styles.resultMessage}>{ocrResult.message}</Text>

          {ocrResult.extracted_text ? (
            <>
              <Text variant="labelLarge" style={styles.resultHeading}>
                {showingTranslation ? "English Translation" : "Original Extracted Text"}
              </Text>
              <Text selectable style={styles.extractedText}>
                {showingTranslation && translatedText ? translatedText : ocrResult.extracted_text}
              </Text>
            </>
          ) : (
            <Text style={styles.helper}>
              No readable text was detected. Try a clearer, closer photograph.
            </Text>
          )}

          <Button
            mode="outlined"
            icon="content-copy"
            onPress={async () => {
              await Clipboard.setStringAsync(ocrResult.extracted_text);
              Alert.alert("Copied", "Extracted text copied to clipboard.");
            }}
            disabled={!ocrResult.extracted_text}
          >
            Copy Extracted Text
          </Button>
          {translatedText && (
            <Button
              mode="outlined"
              icon="content-copy"
              onPress={async () => {
                await Clipboard.setStringAsync(translatedText);
                Alert.alert("Copied", "English translation copied to clipboard.");
              }}
            >
              Copy Translation
            </Button>
          )}
          <Text style={styles.wordCount}>
            Words detected: {ocrResult.word_count}
          </Text>
          <Text style={styles.language}>OCR languages used: {ocrResult.language === "eng+tel" ? "English + Telugu" : ocrResult.language}</Text>
          </Surface>
        </>
      )}

      <Text style={styles.footer}>
        HERITAGEAI · PRESERVING HISTORY THROUGH TECHNOLOGY
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 48,
    paddingBottom: 40,
  },
  heading: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  uploadCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholder: {
    minHeight: 270,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  scanIcon: {
    fontSize: 66,
    color: colors.secondary,
    marginBottom: spacing.md,
  },
  placeholderTitle: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontWeight: "700",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  helper: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 23,
  },
  preview: {
    width: "100%",
    height: 320,
    resizeMode: "cover",
  },
  button: {
    borderRadius: 16,
    marginBottom: spacing.md,
    borderColor: colors.primary,
  },
  buttonContent: {
    height: 54,
  },
  analyzeButton: {
    borderRadius: 16,
    marginTop: spacing.sm,
    backgroundColor: colors.secondary,
  },
  loading: {
    alignItems: "center",
    gap: 12,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  resultCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 22,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  languageOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  translateButton: {
    borderColor: colors.secondary,
    borderRadius: 12,
  },
  translateButtonLabel: {
    fontSize: 11,
  },
  resultHeading: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontWeight: "700",
  },
  resultMessage: {
    color: colors.success,
    fontWeight: "600",
    lineHeight: 22,
  },
  extractedText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 27,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 14,
  },
  wordCount: {
    color: colors.muted,
    fontSize: 12,
  },
  language: {
    color: colors.muted,
    fontSize: 12,
  },
  footer: {
    color: colors.muted,
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 1.2,
    marginTop: spacing.xl,
  },
});

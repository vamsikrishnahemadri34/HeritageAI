import { useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Text,
  TextInput,
  IconButton,
  Surface,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../src/theme";
import { loadChatHistory, saveChatHistory } from "../../src/services/chatStorage";
import {
  sendChatMessage,
  type ChatMessage,
} from "../../src/services/chat";

const suggestions = [
  "Tell me about Indian temples",
  "What is an ancient inscription?",
  "How can we preserve monuments?",
  "Explore the history of forts",
];

function formatMarkdownLine(line: string, index: number) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
  const bullet = trimmed.match(/^[-*]\s+(.+)$/);
  const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);

  const text = heading?.[2] ?? bullet?.[1] ?? numbered?.[1] ?? trimmed;
  const prefix = bullet ? "•  " : numbered ? `${trimmed.match(/^\d+/)?.[0]}.  ` : "";
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <Text
      key={index}
      style={{
        fontSize: heading ? (heading[1].length === 1 ? 19 : 16) : 14,
        fontWeight: heading || bullet || numbered ? "700" : "400",
        color: colors.text,
        lineHeight: 23,
        marginBottom: 7,
      }}
    >
      {prefix}
      {parts.map((part, partIndex) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <Text key={partIndex} style={{ fontWeight: "700", color: colors.primary }}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Text key={partIndex}>{part}</Text>
        )
      )}
    </Text>
  );
}

function NativeMarkdown({ content }: { content: string }) {
  return (
    <View>
      {content.split("\n").map((line, index) =>
        formatMarkdownLine(line, index)
      )}
    </View>
  );
}

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sending, setSending] = useState(false);

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string | null>(null);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    let active = true;

    async function restoreHistory() {
      try {
        const savedMessages = await loadChatHistory();
        if (active) setMessages(savedMessages);
      } catch (error) {
        console.warn("Could not restore chat history:", error);
      } finally {
        if (active) setHistoryLoaded(true);
      }
    }

    restoreHistory();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;

    saveChatHistory(messages).catch((error) => {
      console.warn("Could not save chat history:", error);
    });
  }, [messages, historyLoaded]);

  async function pickImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      if (!asset.base64) {
        throw new Error("Could not read this image. Please select another image.");
      }

      const uri = asset.uri;
      const mimeType =
        asset.mimeType ||
        (uri.toLowerCase().endsWith(".png")
          ? "image/png"
          : uri.toLowerCase().endsWith(".webp")
            ? "image/webp"
            : "image/jpeg");

      if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
        throw new Error("Please select a JPG, PNG, or WEBP image.");
      }

      setSelectedImageUri(uri);
      setSelectedImageBase64(asset.base64);
      setSelectedImageMimeType(mimeType);
    } catch (error) {
      console.warn("Image selection failed:", error);
    }
  }

  function removeSelectedImage() {
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
    setSelectedImageMimeType(null);
  }

  async function sendMessage(text = message) {
    const trimmed = text.trim();

    if ((!trimmed && !selectedImageBase64) || sending) return;

    const imageUri = selectedImageUri;
    const imageBase64 = selectedImageBase64;
    const imageMimeType = selectedImageMimeType;

    const imagePrompt =
      "Analyze this image in detail as a heritage expert. Describe all visible objects, architecture, materials, symbols and inscriptions. Explain possible historical and cultural significance, approximate period only when supported by visual evidence, and visible condition or preservation concerns. Clearly distinguish direct observations from hypotheses. Do not invent an exact identity, date, location, inscription meaning or historical fact. Mention image limitations and uncertainty.";

    const apiMessage = trimmed || imagePrompt;
    const visibleMessage = trimmed || "Please analyze this heritage image.";

    const userMessage: ChatMessage = {
      id: `${Date.now()}`,
      text: visibleMessage,
      sender: "user",
      ...(imageUri ? { imageUri } : {}),
    };

    const previousMessages = messages;

    setMessages((previous) => [...previous, userMessage]);
    setMessage("");
    removeSelectedImage();
    setSending(true);

    try {
      const response = await sendChatMessage(
        apiMessage,
        previousMessages,
        imageBase64 || undefined,
        imageMimeType || undefined
      );

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        text: response.reply,
        sender: "assistant",
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-error`,
          text: errorMessage,
          sender: "assistant",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DISCOVER THE PAST</Text>
            <Text variant="headlineMedium" style={styles.title}>
              Heritage Assistant
            </Text>
            <Text style={styles.subtitle}>
              Your companion for history and culture
            </Text>
          </View>
          <Surface style={styles.avatar} elevation={0}>
            <Text style={styles.avatarIcon}>🏛️</Text>
          </Surface>
        </View>

        {messages.length === 0 ? (
          <View style={styles.welcome}>
            <View style={styles.welcomeIcon}>
              <Text style={styles.welcomeEmoji}>🏺</Text>
            </View>

            <Text variant="headlineSmall" style={styles.welcomeTitle}>
              Explore our heritage
            </Text>
            <Text style={styles.welcomeDescription}>
              Ask me about ancient civilizations, monuments, inscriptions,
              architecture and cultural traditions.
            </Text>

            <Text style={styles.suggestionHeading}>TRY ASKING</Text>

            {suggestions.map((item) => (
              <Pressable
                key={item}
                style={styles.suggestion}
                onPress={() => sendMessage(item)}
                disabled={sending}
              >
                <Text style={styles.suggestionText}>{item}</Text>
                <Text style={styles.suggestionArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageRow,
                  item.sender === "user" && styles.userMessageRow,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    item.sender === "user"
                      ? styles.userBubble
                      : styles.assistantBubble,
                  ]}
                >
                  {item.sender === "user" ? (
                    <>
                      {item.imageUri && (
                        <Image
                          source={{ uri: item.imageUri }}
                          style={styles.messageImage}
                          resizeMode="cover"
                        />
                      )}
                      <Text style={[styles.bubbleText, styles.userBubbleText]}>
                        {item.text}
                      </Text>
                    </>
                  ) : (
                    <NativeMarkdown content={item.text} />
                  )}
                </View>
              </View>
            )}
            ListFooterComponent={
              sending ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>HeritageAI is thinking...</Text>
                </View>
              ) : undefined
            }
          />
        )}

        <View style={styles.inputArea}>
          {selectedImageUri && (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <IconButton
                icon="close-circle"
                size={24}
                iconColor={colors.danger}
                style={styles.removePreview}
                onPress={removeSelectedImage}
                disabled={sending}
              />
            </View>
          )}

          <View style={styles.composerRow}>
            <Pressable
              style={styles.attachButton}
              onPress={pickImage}
              disabled={sending}
              accessibilityLabel="Attach heritage image"
            >
              <Text style={styles.attachText}>+</Text>
            </Pressable>

            <TextInput
              mode="flat"
              placeholder="Ask HeritageAI anything..."
              placeholderTextColor={colors.muted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={2000}
              style={styles.input}
              contentStyle={styles.inputContent}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              textColor={colors.text}
              disabled={sending}
              dense
            />

            <Pressable
              style={[
                styles.sendButton,
                ((!message.trim() && !selectedImageBase64) || sending) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={(!message.trim() && !selectedImageBase64) || sending}
              accessibilityLabel="Send message"
            >
              <Text style={styles.sendText}>{">"}</Text>
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>
            Attach a heritage image with + to let AI analyze it.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 23,
    paddingTop: 20,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 7,
  },
  title: {
    color: colors.primary,
    fontWeight: "800",
    fontFamily: "Georgia",
    letterSpacing: -0.7,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 5,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#E9E1D1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarIcon: {
    fontSize: 25,
  },
  welcome: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  welcomeIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: "#E9E1D1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeEmoji: {
    fontSize: 30,
  },
  welcomeTitle: {
    color: colors.primary,
    fontWeight: "800",
    fontFamily: "Georgia",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  welcomeDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
  },
  suggestionHeading: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  suggestion: {
    minHeight: 56,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 17,
    marginBottom: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  suggestionText: {
    color: colors.text,
    fontSize: 13,
  },
  suggestionArrow: {
    color: colors.secondary,
    fontSize: 22,
  },
  messageList: {
    padding: 18,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 14,
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 17,
    paddingVertical: 15,
    borderRadius: 19,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5,
  },
  bubbleText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  userBubbleText: {
    color: "#FFFFFF",
  },
  messageImage: {
    width: 220,
    height: 180,
    borderRadius: 10,
    marginBottom: 9,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 12,
  },
  inputArea: {
    paddingHorizontal: 17,
    paddingTop: 13,
    paddingBottom: 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewContainer: {
    alignSelf: "flex-start",
    marginBottom: 8,
    position: "relative",
  },
  previewImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
  },
  removePreview: {
    position: "absolute",
    top: -12,
    right: -12,
    backgroundColor: colors.surface,
    margin: 0,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 60,
    gap: 8,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  attachText: {
    color: colors.primary,
    fontSize: 29,
    lineHeight: 33,
    fontWeight: "400",
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 42,
    backgroundColor: "transparent",
    fontSize: 14,
  },
  inputContent: {
    paddingHorizontal: 5,
    paddingVertical: 9,
    minHeight: 42,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.38,
  },
  sendText: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "600",
  },
  disclaimer: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 10,
    marginTop: 8,
  },
});





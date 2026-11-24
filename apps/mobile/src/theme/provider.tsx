import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { colors } from "./index";

const heritageTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.danger,
  },
};

export { heritageTheme, PaperProvider };

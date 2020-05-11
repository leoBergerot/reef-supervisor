import React from "react";
import {ThemeProvider as ThemeProviderUi} from "@material-ui/styles";

export const ThemeProvider = ({theme, children}) => (
    <ThemeProviderUi theme={theme}>
        {children}
    </ThemeProviderUi>
);
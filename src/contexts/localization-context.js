import React from "react";
import {LocalizationProvider as LocalizationProviderUi} from "@material-ui/pickers";

export const LocalizationProvider = ({children, dateLibInstance, dateAdapter, locale}) => (
    <LocalizationProviderUi dateLibInstance={dateLibInstance} dateAdapter={dateAdapter}
                            locale={locale}>
        {children}
    </LocalizationProviderUi>
);
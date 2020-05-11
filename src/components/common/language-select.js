import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

export const LanguageSelect = ({fullWidth}) => {
    const {t, i18n} = useTranslation();
    const [language, setLanguage] = useState(i18n.language.substring(0, 2));
    const [languages, setLanguages] = useState(i18n.languages);

    useEffect(() => {
        i18n.changeLanguage(language)
    }, [language]);


    return (
        <>
            <Select
                fullWidth={fullWidth}
                disableUnderline
                variant="standard"
                id="language-select"
                value={language}
                type="button"
                onChange={(event) => setLanguage(event.target.value)}
            >
                {languages.map((value, index) => (
                    <MenuItem key={index} value={value}>
                        {t(`language.${value}`)}
                    </MenuItem>
                ))}

            </Select>
        </>
    )

};
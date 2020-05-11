import React from 'react';
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import {useTranslation} from "react-i18next";

export const ConditionRecaptcha = () => {
    const {t, i18n} = useTranslation();
    return (
        <Typography display="block" variant="caption">
            {t('recaptcha.terms.first')} {
            <Link href={`https://policies.google.com/terms?hl=${i18n.language.substring(0,2)}`} variant="caption">
                {t('recaptcha.terms.link')}
            </Link>} {t('recaptcha.terms.second')}
        </Typography>
    )
};
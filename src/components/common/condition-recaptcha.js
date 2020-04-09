import React from 'react';
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";

export const ConditionRecaptcha = () => (
    <Typography display="block" variant="caption">
        This page is protected by Google reCAPTCHA to ensure that you are not a robot. {
        <Link href="https://policies.google.com/terms?hl=fr" variant="caption">
            Terms and conditions of use
        </Link>} of Google
    </Typography>
);
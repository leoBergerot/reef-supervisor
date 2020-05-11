import React, {useContext, useEffect, useState} from "react";
import CardContent from "@material-ui/core/CardContent";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import {GridContainerResponsive} from "../common/grid-container-reponsive";
import CircularProgress from "@material-ui/core/CircularProgress";
import {alertContext} from "../../contexts/alert-context";
import {Recaptcha} from "../common/recaptcha";
import {CardContainerReponsive} from "../common/card-container-responsive";
import Typography from "@material-ui/core/Typography";
import isEmpty from "validator/lib/isEmpty";
import {ConditionRecaptcha} from "../common/condition-recaptcha";
import {appFetch, POST} from "../../utils/app-fetch";
import {useTranslation} from "react-i18next";

export const ForgotPassword = ({history}) => {
    const [email, setEmail] = useState({value: "", error: false, helperText: null});
    const [loading, setLoading] = useState(false);
    const [captchaReady, setCaptchaReady] = useState(false);
    const [submit, setSubmit] = useState(false);
    const [formCanSubmit, setFormCanSubmit] = useState({value: false, recaptchaToken: null});
    const {setAlert} = useContext(alertContext);
    const {t} = useTranslation();

    useEffect(() => {
        if (formCanSubmit.value) {
            appFetch(
                POST,
                'forgot-password',
                {email: email.value, recaptchaToken: formCanSubmit.recaptchaToken},
                null,
                (result) => {
                    setLoading(false);
                    if (result.email) {
                        setAlert({
                            open: true,
                            message: t('forgot_password.success', {email: email.value}),
                            severity: 'success'
                        });
                        history.replace('/');
                        return null;
                    }
                },
                (error) => {
                    setLoading(false);
                    if (error.statusCode === 400) {
                        setEmail({
                            value: email.value,
                            error: true,
                            helperText: t(`forgot_password.error.${error.message}`, {email: email.value})
                        })
                    }
                },
                setAlert
            );
            setFormCanSubmit({value: false, recaptchaToken: null});
            setSubmit(false);
        }
    }, [formCanSubmit]);


    const captchaResponse = (recaptchaToken) => {
        setFormCanSubmit({value: true, recaptchaToken});
    };

    const onSubmit = (event) => {
        event.preventDefault();
        let error = false;
        if (isEmpty(email.value)) {
            setEmail({value: "", error: true, helperText: t("forgot_password.error.no_email")});
            error = true;
        }

        if (!error) {
            setSubmit(true);
            setLoading(true);
        }
    };

    return (
        <GridContainerResponsive>
            <CardContainerReponsive>
                <form onSubmit={onSubmit}>
                    <CardContent>
                        <Typography variant="h4" component="h4" gutterBottom>
                            {t("forgot_password.title")}
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            {t("forgot_password.subtitle")}
                        </Typography>
                        <TextField
                            margin="dense"
                            label={t("forgot_password.email")}
                            disabled={!captchaReady}
                            fullWidth
                            autoFocus
                            onChange={e => {
                                setEmail({value: e.target.value, error: false, helperText: false});
                            }}
                            error={email.error}
                            helperText={email.helperText}
                        />
                        <Recaptcha responseCallback={captchaResponse} setCaptchaReady={setCaptchaReady}
                                   submit={submit}/>
                    </CardContent>
                    <CardContent>
                        <Button
                            fullWidth={true}
                            disabled={email.error || !captchaReady || loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            {t("forgot_password.button")} {loading && (<CircularProgress size={25}/>)}
                        </Button>
                    </CardContent>
                    <CardContent>
                        <ConditionRecaptcha/>
                    </CardContent>
                </form>
            </CardContainerReponsive>
        </GridContainerResponsive>
    )
}
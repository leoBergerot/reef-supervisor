import React, {useContext, useEffect, useState} from "react";
import {alertContext} from "../../contexts/alert-context";
import {GridContainerResponsive} from "../common/grid-container-reponsive";
import CardContent from "@material-ui/core/CardContent";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import {Recaptcha} from "../common/recaptcha";
import {CardContainerReponsive} from "../common/card-container-responsive";
import isEmpty from "validator/lib/isEmpty";
import Typography from "@material-ui/core/Typography";
import {ConditionRecaptcha} from "../common/condition-recaptcha";
import isAlphanumeric from "validator/es/lib/isAlphanumeric";
import isLength from "validator/es/lib/isLength";
import {appFetch, POST} from "../../utils/app-fetch";
import {useTranslation} from "react-i18next";

export const RecoverPassword = ({match: {params: {id, token}}, history}) => {
    const [newPassword, setNewPassword] = useState({value: "", error: false, helperText: null});
    const [loading, setLoading] = useState(false);
    const {setAlert} = useContext(alertContext);
    const [captchaReady, setCaptchaReady] = useState(false);
    const [submit, setSubmit] = useState(false);
    const [formCanSubmit, setFormCanSubmit] = useState({value: false, recaptchaToken: null});

    const {t} = useTranslation();

    useEffect(() => {
        if (formCanSubmit.value) {
            setLoading(true);
            appFetch(
                POST,
                'recover-password',
                {
                    newPassword: newPassword.value,
                    token,
                    id,
                    recaptchaToken: formCanSubmit.recaptchaToken
                },
                null,
                (result) => {
                    setLoading(false);
                    if (result.username) {
                        setAlert({
                            open: true,
                            message: t('recover.success', {first_name: result.firstName, last_name: result.lastName}),
                            severity: 'success'
                        });
                        history.replace('/');
                        return null;
                    }
                },
                (error) => {
                    setLoading(false);
                    if (error && error.statusCode === 403) {
                        setAlert({
                            open: true,
                            message: t('recover.error.403'),
                            severity: 'error'
                        });
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
        let helperText = "";

        if (isEmpty(newPassword.value)) {
            helperText = t('recover.error.password.no');
            error = true;
        }

        if (!error && !isLength(newPassword.value, 6)) {
            helperText = t('recover.error.password.short');
            error = true;
        }

        if (isAlphanumeric(newPassword.value)) {
            helperText = (!error ? t('recover.error.password.alphanumeric_only') : helperText + t('recover.error.password.alphanumeric'));
            error = true;
        }

        if (!error) {
            setSubmit(true);
            setLoading(true);
        } else {
            setNewPassword({
                value: newPassword.value,
                error: true,
                helperText: helperText
            });
        }
    };

    return (
        <GridContainerResponsive>
            <CardContainerReponsive>
                <form onSubmit={onSubmit}>
                    <CardContent>
                        <Typography variant="h4" component="h4" gutterBottom>
                            {t('recover.title')}
                        </Typography>
                        <TextField
                            margin="dense"
                            label={t('recover.password')}
                            type="password"
                            disabled={!captchaReady}
                            fullWidth
                            autoFocus
                            onChange={e => {
                                setNewPassword({value: e.target.value, error: false, helperText: false});
                            }}
                            error={newPassword.error}
                            helperText={newPassword.helperText}
                        />
                        <Recaptcha responseCallback={captchaResponse} setCaptchaReady={setCaptchaReady}
                                   submit={submit}/>
                    </CardContent>
                    <CardContent>
                        <Button
                            fullWidth={true}
                            disabled={newPassword.error || !captchaReady || loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            {t('recover.button')} {loading && (<CircularProgress size={25}/>)}
                        </Button>
                    </CardContent>
                    <CardContent>
                        <ConditionRecaptcha/>
                    </CardContent>
                </form>
            </CardContainerReponsive>
        </GridContainerResponsive>
    );
};
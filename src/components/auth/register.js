import React, {useContext, useEffect, useState} from 'react';
import {GridContainerResponsive} from "../common/grid-container-reponsive";
import {CardContainerReponsive} from "../common/card-container-responsive";
import isEmpty from "validator/lib/isEmpty";
import isLength from "validator/es/lib/isLength";
import isAlphanumeric from "validator/es/lib/isAlphanumeric";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import {ConditionRecaptcha} from "../common/condition-recaptcha";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import {Recaptcha} from "../common/recaptcha";
import isEmail from "validator/es/lib/isEmail";
import {alertContext} from "../../contexts/alert-context";
import {appFetch, POST} from "../../utils/app-fetch";
import {useTranslation} from "react-i18next";

export const Register = ({history}) => {
    const [password, setPassword] = useState({value: "", error: false, helperText: null});
    const [email, setEmail] = useState({value: "", error: false, helperText: null});
    const [firstName, setFirstName] = useState({value: "", error: false, helperText: null});
    const [lastName, setLastName] = useState({value: "", error: false, helperText: null});


    const [loading, setLoading] = useState(false);
    const [captchaReady, setCaptchaReady] = useState(false);
    const [submit, setSubmit] = useState(false);
    const [formCanSubmit, setFormCanSubmit] = useState({value: false, recaptchaToken: null});

    const {setAlert} = useContext(alertContext);
    const {t} = useTranslation();

    useEffect(() => {
        if (formCanSubmit.value) {
            setLoading(true);
            appFetch(
                POST,
                'users',
                {
                    plainPassword: password.value,
                    firstName: firstName.value,
                    lastName: lastName.value,
                    email: email.value,
                    recaptchaToken: formCanSubmit.recaptchaToken
                },
                null,
                (result) => {
                    setAlert({
                        open: true,
                        message: t('register.success', {
                            first_name: result.firstName,
                            last_name: result.lastName,
                            email: result.email
                        }),
                        severity: 'success'
                    });
                    history.replace('/');
                    return null;
                },
                (error) => {
                    if (error && error.statusCode === 400) {
                        error.message.forEach((value) => {
                            let field = value.split(' ')[0];
                            eval(`set${field}`)({
                                value: "",
                                error: true,
                                helperText: t(`register.error.${value.substring(field.length+1, value.length)}`)
                            })
                        })
                    }
                }
            );
            setFormCanSubmit({value: false, recaptchaToken: null});
            setSubmit(false);
        }
    }, [formCanSubmit]);

    const onSubmit = (event) => {
        event.preventDefault();
        let error = {password: false, email: false, lastName: false, firstName: false};
        let helperText = {password: "", email: "", lastName: "", firstName: ""};

        if (isEmpty(password.value)) {
            helperText.password = t('register.error.password.no');
            error.password = true;
        }

        if (!error.password && !isLength(password.value, 6)) {
            helperText.password = t('register.error.password.short');
            error.password = true;
        }

        if (isAlphanumeric(password.value)) {
            helperText.password = (!error.password ? t('register.error.password.alphanumeric_only') : helperText.password + t('register.error.password.alphanumeric'));
            error.password = true;
        }

        if (isEmpty(firstName.value)) {
            helperText.firstName = t('register.error.first_name');
            error.firstName = true;
        }

        if (isEmpty(lastName.value)) {
            helperText.lastName = t('register.error.last_name');
            error.lastName = true;
        }

        if (isEmpty(email.value)) {
            helperText.email = t('register.error.email.no');
            error.email = true;
        }

        if (!error.email && !isEmail(email.value)) {
            helperText.email = t('register.error.email.valid');
            error.email = true;
        }

        if (!error.password && !error.firstName && !error.lastName && !error.email) {
            setSubmit(true);
            setLoading(true);
            return;
        }

        if (error.password) {
            setPassword({
                value: password.value,
                error: true,
                helperText: helperText.password
            });
        }
        if (error.firstName) {
            setFirstName({
                value: firstName.value,
                error: true,
                helperText: helperText.firstName
            });
        }
        if (error.lastName) {
            setLastName({
                value: lastName.value,
                error: true,
                helperText: helperText.lastName
            });
        }
        if (error.email) {
            setEmail({
                value: email.value,
                error: true,
                helperText: helperText.email
            });
        }
    };

    const captchaResponse = (recaptchaToken) => {
        setFormCanSubmit({value: true, recaptchaToken});
    };

    return (
        <GridContainerResponsive>
            <CardContainerReponsive>
                <form onSubmit={onSubmit}>
                    <CardContent>
                        <Typography variant="h4" component="h4" gutterBottom>
                            {t('register.title')}
                        </Typography>
                        <TextField
                            margin="dense"
                            label={t('register.first_name')}
                            disabled={!captchaReady}
                            fullWidth
                            autoFocus
                            onChange={e => {
                                setFirstName({value: e.target.value, error: false, helperText: false});
                            }}
                            error={firstName.error}
                            helperText={firstName.helperText}
                        />
                        <TextField
                            margin="dense"
                            label={t('register.last_name')}
                            disabled={!captchaReady}
                            fullWidth
                            autoFocus
                            onChange={e => {
                                setLastName({value: e.target.value, error: false, helperText: false});
                            }}
                            error={lastName.error}
                            helperText={lastName.helperText}
                        />
                        <TextField
                            margin="dense"
                            label={t('register.email')}
                            disabled={!captchaReady}
                            fullWidth
                            autoFocus
                            onChange={e => {
                                setEmail({value: e.target.value, error: false, helperText: false});
                            }}
                            error={email.error}
                            helperText={email.helperText}
                        />
                        <TextField
                            margin="dense"
                            label={t('register.password')}
                            type="password"
                            disabled={!captchaReady}
                            fullWidth
                            autoFocus
                            onChange={e => {
                                setPassword({value: e.target.value, error: false, helperText: false});
                            }}
                            error={password.error}
                            helperText={password.helperText}
                        />
                        <Recaptcha
                            responseCallback={captchaResponse}
                            setCaptchaReady={setCaptchaReady}
                            submit={submit}/>
                    </CardContent>
                    <CardContent>
                        <Button
                            fullWidth={true}
                            disabled={password.error || email.error || lastName.error || firstName.error ||!captchaReady || loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            {t('register.button')} {loading && (<CircularProgress size={25}/>)}
                        </Button>
                    </CardContent>
                    <CardContent>
                        <ConditionRecaptcha/>
                    </CardContent>
                </form>
            </CardContainerReponsive>
        </GridContainerResponsive>
    )
};
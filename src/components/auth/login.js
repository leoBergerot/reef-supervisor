import React, {useContext, useEffect, useState} from "react";
import TextField from "@material-ui/core/TextField";
import CardContent from "@material-ui/core/CardContent";
import Link from "@material-ui/core/Link";
import {GridContainerResponsive} from "../common/grid-container-reponsive";
import Button from "@material-ui/core/Button";
import {authContext} from "../../contexts/auth-context";
import CircularProgress from "@material-ui/core/CircularProgress";
import {Recaptcha} from "../common/recaptcha";
import {CardContainerReponsive} from "../common/card-container-responsive";
import isEmpty from 'validator/lib/isEmpty';
import Typography from "@material-ui/core/Typography";
import {ConditionRecaptcha} from "../common/condition-recaptcha";
import {alertContext} from "../../contexts/alert-context";

export const Login = ({history, match: {params: {enable}}}) => {
    const {setAuthData} = useContext(authContext);
    const {setAlert} = useContext(alertContext);

    const [email, setEmail] = useState({value: "", error: false, helperText: null});
    const [password, setPassword] = useState({value: "", error: false, helperText: null});

    const [loading, setLoading] = useState(false);
    const [captchaReady, setCaptchaReady] = useState(false);
    const [submit, setSubmit] = useState(false);
    const [formCanSubmit, setFormCanSubmit] = useState({value: false, recaptchaToken: null});

    useEffect(() => {
        if (formCanSubmit.value) {
            setLoading(true);
            fetch(process.env.REACT_APP_API_URL + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({password: password.value, username: email.value, recaptchaToken: formCanSubmit.recaptchaToken})
            })
                .then(res => res.json())
                .then(
                    (result) => {
                        setLoading(false);
                        if (result.access_token) {
                            setAuthData(result.access_token);
                            history.replace('/');
                            return null;
                        } else if (result.statusCode === 403) {
                            setPassword({value: password.value, error: true, helperText: result.message})
                        } else if (result.statusCode === 404) {
                            setEmail({value: email.value, error: true, helperText: result.message});
                            setPassword({value: null, error: false, helperText: null});
                        } else if (result.statusCode === 401) {
                            setAlert({
                                open: true,
                                message: result.message,
                                severity: 'warning'
                            });
                        }
                        setLoading(false);
                    },

                    (error) => {
                        setLoading(false);
                        console.log(error)
                    }
                );
            setFormCanSubmit({value: false, recaptchaToken: null});
            setSubmit(false);
        }
    }, [formCanSubmit]);

    useEffect(() => {
        if (enable) {
            setAlert({
                open: true,
                message: "Your account are successfully enabled",
                severity: "success"
            })
        }
    }, [enable]);

    const captchaResponse = (recaptchaToken) => {
        setFormCanSubmit({value: true, recaptchaToken});
    };

    const handleRecoverPassword = e => {
        history.push('/forgot-password');
        e.preventDefault();
    };

    const handleRegister = e => {
        history.push('/register');
        e.preventDefault();
    };

    const onSubmit = (event) => {
        event.preventDefault();
        let error = false;
        if (isEmpty(email.value)) {
            setEmail({value: "", error: true, helperText: "Please enter an email address"});
            error = true;
        }

        if (isEmpty(password.value)) {
            setPassword({value: "", error: true, helperText: "Please enter your password"});
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
                            Sign in
                        </Typography>
                        <TextField
                            margin="dense"
                            label="Email"
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
                            label="Password"
                            disabled={!captchaReady}
                            fullWidth
                            type="password"
                            value={password.value ? password.value : ""}
                            error={password.error}
                            helperText={password.helperText}
                            onChange={e => {
                                setPassword({value: e.target.value, error: false, helperText: false});
                            }}
                        />
                        <Recaptcha responseCallback={captchaResponse} setCaptchaReady={setCaptchaReady}
                                   submit={submit}/>
                    </CardContent>
                    <CardContent>
                        <Button
                            fullWidth={true}
                            disabled={password.error || email.error || !captchaReady || loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            Sign in {loading && (<CircularProgress size={25}/>)}
                        </Button>
                    </CardContent>
                    <CardContent>
                        <Typography display="block" variant="subtitle1" gutterBottom>
                            First visit to Reef Supervisor ? {<Link href="#" onClick={handleRegister}
                                                                    variant="body2">
                            Sign up now.
                        </Link>}
                        </Typography>
                        <Typography display="block" variant="subtitle1" gutterBottom>
                            Password forgotten ? {<Link href="#" onClick={handleRecoverPassword} variant="body2">
                            Reset password.
                        </Link>}
                        </Typography>
                        <ConditionRecaptcha/>
                    </CardContent>
                </form>
            </CardContainerReponsive>
        </GridContainerResponsive>
    )
};
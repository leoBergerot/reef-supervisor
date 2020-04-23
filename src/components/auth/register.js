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

    useEffect(() => {
        if (formCanSubmit.value) {
            setLoading(true);
            fetch(process.env.REACT_APP_API_URL + '/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plainPassword: password.value,
                    firstName: firstName.value,
                    lastName: lastName.value,
                    email: email.value,
                    recaptchaToken: formCanSubmit.recaptchaToken
                })
            })
                .then(res => res.json())
                .then(
                    (result) => {
                        setLoading(false);
                        if (result.username) {
                            setAlert({
                                open: true,
                                message: `${result.firstName} ${result.lastName}, an email was send to validate your account at ${result.email}, (check also your junk box)`,
                                severity: 'success'
                            });
                            history.replace('/');
                            return null;
                        } else if (result.statusCode === 400) {
                            result.message.forEach((value) => {
                                let field = value.split(' ')[0];
                                eval(`set${field}`)({
                                    value: "",
                                    error: true,
                                    helperText: value.substring(field.length, value.length)
                                });
                            })
                        } else {
                            setAlert({
                                open: true,
                                message: `An error occurred in server`,
                                severity: 'error'
                            });
                        }
                        setLoading(false);
                    },
                    (error) => {
                        setLoading(false);
                        setAlert({
                            open: true,
                            message: `Network error`,
                            severity: 'error'
                        });
                    });
            setFormCanSubmit({value: false, recaptchaToken: null});
            setSubmit(false);
        }
    }, [formCanSubmit]);

    const onSubmit = (event) => {
        event.preventDefault();
        let error = {password: false, email: false, lastName: false, firstName: false};
        let helperText = {password: "", email: "", lastName: "", firstName: ""};

        if (isEmpty(password.value)) {
            helperText.password = "Please enter password";
            error.password = true;
        }

        if (!error.password && !isLength(password.value, 6)) {
            helperText.password = "Must be at least 6 characters long";
            error.password = true;
        }

        if (isAlphanumeric(password.value)) {
            helperText.password = (!error.password ? "Please enter alphanumeric password" : helperText.password + " and alphanumeric");
            error.password = true;
        }

        if (isEmpty(firstName.value)) {
            helperText.firstName = "Please enter your first name";
            error.firstName = true;
        }

        if (isEmpty(lastName.value)) {
            helperText.lastName = "Please enter your last name";
            error.lastName = true;
        }

        if (isEmpty(email.value)) {
            helperText.email = "Please enter your email";
            error.email = true;
        }

        if (!error.email && !isEmail(email.value)) {
            helperText.email = "Please enter a valid email";
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
        <GridContainerResponsive baseline={true}>
            <CardContainerReponsive>
                <form onSubmit={onSubmit}>
                    <CardContent>
                        <Typography variant="h4" component="h4" gutterBottom>
                            Register
                        </Typography>
                        <TextField
                            margin="dense"
                            label="First name"
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
                            label="Last name"
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
                            Register {loading && (<CircularProgress size={25}/>)}
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
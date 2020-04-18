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

export const RecoverPassword = ({match: {params: {id, token}}, history}) => {
    const [newPassword, setNewPassword] = useState({value: "", error: false, helperText: null});
    const [loading, setLoading] = useState(false);
    const {setAlert} = useContext(alertContext);
    const [captchaReady, setCaptchaReady] = useState(false);
    const [submit, setSubmit] = useState(false);
    const [formCanSubmit, setFormCanSubmit] = useState({value: false, recaptchaToken: null});

    useEffect(() => {
        if (formCanSubmit.value) {
            setLoading(true);
            fetch(process.env.REACT_APP_API_URL + '/recover-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    newPassword: newPassword.value,
                    token,
                    id,
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
                                message: `${result.firstName} ${result.lastName}, your password was change`,
                                severity: 'success'
                            });
                            history.replace('/');
                            return null;
                        } else if (result.statusCode === 400) {
                            setNewPassword({value: newPassword.value, error: true, helperText: result.message})
                        } else if (result.statusCode === 403) {
                            setAlert({
                                open: true,
                                message: `This link are expired`,
                                severity: 'error'
                            });
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
                    }
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
            helperText = "Please enter your password";
            error = true;
        }

        if (!error && !isLength(newPassword.value, 6)) {
            helperText = "Must be at least 6 characters long";
            error = true;
        }

        if (isAlphanumeric(newPassword.value)) {
            helperText = (!error ? "Please enter alphanumeric password" : helperText + " and alphanumeric");
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
                            Reset your password
                        </Typography>
                        <TextField
                            margin="dense"
                            label="Password"
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
                            Update {loading && (<CircularProgress size={25}/>)}
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
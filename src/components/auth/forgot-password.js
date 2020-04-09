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

export const ForgotPassword = ({history}) => {
    const [email, setEmail] = useState({value: "", error: false, helperText: null});
    const [loading, setLoading] = useState(false);
    const [captchaReady, setCaptchaReady] = useState(false);
    const [submit, setSubmit] = useState(false);
    const [formCanSubmit, setFormCanSubmit] = useState({value: false, recaptchaToken: null});
    const {setAlert} = useContext(alertContext);


    useEffect(() => {
        if (formCanSubmit.value) {
            fetch(process.env.REACT_APP_API_URL + '/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email: email.value, recaptchaToken: formCanSubmit.recaptchaToken})
            })
                .then(res => res.json())
                .then(
                    (result) => {
                        setLoading(false);
                        if (result.email) {
                            setAlert({
                                open: true,
                                message: `A email has been sended to ${email.value} , (check also your junk box)`,
                                severity: 'success'
                            });
                            history.replace('/');
                            return null;
                        } else if (result.statusCode === 400) {
                            setEmail({value: email.value, error: true, helperText: result.message})
                        } else {
                            setAlert({
                                open: true,
                                message: `An error occured: ${result.message}`,
                                severity: 'error'
                            });
                        }
                        setLoading(false);
                    },
                    (error) => {
                        setLoading(false);
                        setAlert({
                            open: true,
                            message: `${error.message}`,
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
        if (isEmpty(email.value)) {
            setEmail({value: "", error: true, helperText: "Please enter an email address"});
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
                            Forgot password
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            We will send you instructions on how to reset your password by e-mail.
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
                        <Recaptcha responseCallback={captchaResponse} setCaptchaReady={setCaptchaReady}
                                   submit={submit}/>
                    </CardContent>
                    <CardContent>
                        <Button
                            fullWidth={true}
                            disabled={email.error || !captchaReady}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            Send me an email {loading && (<CircularProgress size={25}/>)}
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
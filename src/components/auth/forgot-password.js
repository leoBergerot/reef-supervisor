import React, {useContext, useEffect, useState} from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import Card from "@material-ui/core/Card/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import TextField from "@material-ui/core/TextField";
import CardActions from "@material-ui/core/CardActions/CardActions";
import Button from "@material-ui/core/Button";
import {GridContainerResponsive} from "../common/grid-container-reponsive";
import CircularProgress from "@material-ui/core/CircularProgress";
import {alertContext} from "../../contexts/alert-context";
import {Recaptcha} from "../common/recaptcha";

const useStyles = makeStyles((theme) => createStyles({
    root: {
        [theme.breakpoints.down("xs")]: {
            boxShadow: '0 0 0 0',
        }
    }
}));

export const ForgotPassword = ({history}) => {
    const classes = useStyles();
    const [email, setEmail] = useState({value: null, error: false, helperText: null});
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
        setSubmit(true);
        setLoading(true);
    };

    return (
        <GridContainerResponsive>
            <Card className={classes.root}>
                <form onSubmit={onSubmit}>
                    <CardHeader title="Forgot password ?" subheader="Enter your email for recovered your account"/>
                    <CardContent>
                        <TextField
                            label="Your email"
                            disabled={!captchaReady}
                            required
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
                    <CardActions>
                        <Button
                            disabled={email.error || !captchaReady}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            Recover {loading && (<CircularProgress/>)}
                        </Button>
                    </CardActions>
                </form>
            </Card>
        </GridContainerResponsive>
    )
}
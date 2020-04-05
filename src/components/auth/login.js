import React, {useContext, useState} from "react";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import TextField from "@material-ui/core/TextField";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Link from "@material-ui/core/Link";
import {GridContainerResponsive} from "../common/GridContainerReponsive";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import {authContext} from "../../contexts/auth-context";
import CircularProgress from "@material-ui/core/CircularProgress";

const useStyles = makeStyles((theme) => createStyles({
    root: {
        [theme.breakpoints.down("xs")]: {
            boxShadow: '0 0 0 0',
        }
    }
}));

export const Login = ({history}) => {
    const classes = useStyles();
    const {setAuthData} = useContext(authContext);
    const [email, setEmail] = useState({value: null, error: false, helperText: null});
    const [password, setPassword] = useState({value: null, error: false, helperText: null});
    const [loading, setLoading] = useState(false);

    const onFormSubmit = e => {
        setLoading(true);
        fetch(process.env.REACT_APP_API_URL + '/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({password: password.value, username: email.value,})
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
                    }
                    setLoading(false);
                },

                (error) => {
                    setLoading(false);
                    console.log(error)
                }
            );
        e.preventDefault();
    };

    const handleRecoverPassword = e => {
        history.replace('/forgot-password');
        e.preventDefault();
    };

    return (
        <GridContainerResponsive>
            <Card className={classes.root}>
                <form onSubmit={onFormSubmit}>
                    <CardHeader title="Login" subheader="To continue to supervising your tank"/>
                    <CardContent>
                        <TextField
                            label="Enter your email"
                            required
                            fullWidth
                            autoFocus
                            onChange={e => {
                                setEmail({value: e.target.value, error: false, helperText: false});
                            }}
                            error={email.error}
                            helperText={email.helperText}
                        />
                        <TextField
                            label="Enter your password"
                            fullWidth
                            required
                            type="password"
                            value={password.value ? password.value : ""}
                            error={password.error}
                            helperText={password.helperText}
                            onChange={e => {
                                setPassword({value: e.target.value, error: false, helperText: false});
                            }}
                        />
                    </CardContent>
                    <CardActions>
                        <Button
                            disabled={password.error || email.error}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            Sign in {loading && (<CircularProgress/>)}
                        </Button>
                        <Link href="#" onClick={handleRecoverPassword} variant="body2">
                            Recover password
                        </Link>
                    </CardActions>
                </form>
            </Card>
        </GridContainerResponsive>
    )
};
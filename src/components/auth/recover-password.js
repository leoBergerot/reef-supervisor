import React, {useContext, useState} from "react";
import {alertContext} from "../../contexts/alert-context";
import {GridContainerResponsive} from "../common/grid-container-reponsive";
import Card from "@material-ui/core/Card/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import TextField from "@material-ui/core/TextField";
import CardActions from "@material-ui/core/CardActions/CardActions";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import {createStyles, makeStyles} from "@material-ui/core/styles";


const useStyles = makeStyles((theme) => createStyles({
    root: {
        [theme.breakpoints.down("xs")]: {
            boxShadow: '0 0 0 0',
        }
    }
}));

export const RecoverPassword = ({match: {params: {id, token}}, history}) => {
    const classes = useStyles();
    const [newPassword, setNewPassword] = useState({value: null, error: false, helperText: null});
    const [loading, setLoading] = useState(false);
    const {setAlert} = useContext(alertContext);

    const onFormSubmit = (e) => {
        setLoading(true);
        fetch(process.env.REACT_APP_API_URL + '/recover-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({newPassword: newPassword.value, token, id})
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
        e.preventDefault();
    };

    return (
        <GridContainerResponsive>
            <Card className={classes.root}>
                <form onSubmit={onFormSubmit}>
                    <CardHeader title="Reset your password" subheader="Enter a new password"/>
                    <CardContent>
                        <TextField
                            label="Password"
                            required
                            fullWidth
                            autoFocus
                            onChange={e => {
                                setNewPassword({value: e.target.value, error: false, helperText: false});
                            }}
                            error={newPassword.error}
                            helperText={newPassword.helperText}
                        />
                    </CardContent>
                    <CardActions>
                        <Button
                            disabled={newPassword.error}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            Update {loading && (<CircularProgress/>)}
                        </Button>
                    </CardActions>
                </form>
            </Card>
        </GridContainerResponsive>
    );
};
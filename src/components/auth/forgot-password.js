import React, {useState} from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import Card from "@material-ui/core/Card/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import TextField from "@material-ui/core/TextField";
import CardActions from "@material-ui/core/CardActions/CardActions";
import Button from "@material-ui/core/Button";
import {GridContainerResponsive} from "../common/GridContainerReponsive";
import CircularProgress from "@material-ui/core/CircularProgress";
import Modal from "@material-ui/core/Modal";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles((theme) => createStyles({
    root: {
        [theme.breakpoints.down("xs")]: {
            boxShadow: '0 0 0 0',
        }
    },
    modal: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paper: {
        backgroundColor: theme.palette.background.paper,
        border: '1px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
    },
}));

export const ForgotPassword = ({history}) => {
    const classes = useStyles();
    const [email, setEmail] = useState({value: null, error: false, helperText: null});
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);


    const onFormSubmit = (e) => {
        setLoading(true);

        fetch(process.env.REACT_APP_API_URL + '/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email: email.value})
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setLoading(false);
                    if (result.email) {
                        setOpen(true);
                        return null;
                    } else if (result.statusCode === 400) {
                        setEmail({value: email.value, error: true, helperText: result.message})
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

    const handleOnClose = () => {
        setOpen(false);
        history.replace('/')
    };

    return (
        <GridContainerResponsive>
            <Card className={classes.root}>
                <form onSubmit={onFormSubmit}>
                    <CardHeader title="Forgot password ?" subheader="Enter your email for recovered your account"/>
                    <CardContent>
                        <TextField
                            label="Your email"
                            required
                            fullWidth
                            autoFocus
                            onChange={e => {
                                setEmail({value: e.target.value, error: false, helperText: false});
                            }}
                            error={email.error}
                            helperText={email.helperText}
                        />
                    </CardContent>
                    <CardActions>
                        <Button
                            disabled={email.error}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            Recover {loading && (<CircularProgress/>)}
                        </Button>
                    </CardActions>
                </form>
            </Card>
            <Modal
                open={open}
                onClose={handleOnClose}
                aria-labelledby="success-modal-title"
                aria-describedby="success-modal-description"
                className={classes.modal}
            >
                <Card>
                    <CardContent>
                        <Typography variant="h4" component="h4" id="success-modal-title">Success</Typography>
                        <Typography id="success-modal-description" variant="body1" component="p">An email has been
                            sended to
                            : {email.value} to recover your password</Typography>
                        <Typography id="success-modal-description" variant="body1" component="p">
                            Tips : check also your junk mailbox
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button onClick={handleOnClose}
                            size="small"
                            color="primary"
                        >
                            Ok
                        </Button>
                    </CardActions>
                </Card>
            </Modal>
        </GridContainerResponsive>
    )
};
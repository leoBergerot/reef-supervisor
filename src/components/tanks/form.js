import React, {useContext, useState} from "react";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import {GridContainerResponsive} from "../common/grid-container-reponsive";
import CircularProgress from "@material-ui/core/CircularProgress";
import {alertContext} from "../../contexts/alert-context";
import {authContext} from "../../contexts/auth-context";
import {tankContext} from "../../contexts/tank-context";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import {TypographyResponsive} from "../common/typography-responsive";
import Divider from "@material-ui/core/Divider";
import isEmpty from "validator/lib/isEmpty";
import {DeleteModal} from "../common/delete-modal";

const useStyles = makeStyles((theme) => createStyles({
    form: {
        [theme.breakpoints.up("xs")]: {
            minWidth: "40%",
            marginBottom: "5vh"
        },
        [theme.breakpoints.down("xs")]: {
            minWidth: "90%"
        }
    },
    typography: {
        [theme.breakpoints.up("sm")]: {
            fontSize: '4vw !important'
        },
        [theme.breakpoints.down("sm")]: {
            fontSize: '7vw'
        },
        margin: "1rem 0"
    },
    fields: {
        margin: "1rem 0"
    },
    actions: {
        margin: "1rem 0",
        "& button:not(:first-child)": {
            marginLeft: "1rem"
        }
    }
}));
export const Form = ({history, handleClose, edit, handleEditSuccess}) => {
    const {auth} = useContext(authContext);
    const {setTank} = useContext(tankContext);
    const {setAlert} = useContext(alertContext);

    const [name, setName] = useState({value: (!!edit ? edit.name : ""), error: false, helperText: null});
    const [loading, setLoading] = useState(false);

    const [openDeleteModal, setIsOpenDeleteModal] = useState(false);

    const classes = useStyles();

    const onSubmit = (event) => {
        event.preventDefault();
        let error = false;
        if (isEmpty(name.value)) {
            setName({value: "", error: true, helperText: "Please enter a name"});
            error = true;
        }

        if (error) {
            return;
        }

        fetch(process.env.REACT_APP_API_URL + '/tanks' + (!!edit ? `/${edit.id}` : ""), {
            method: !!edit ? 'PATCH' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + auth.token
            },
            body: JSON.stringify({name: name.value})
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setLoading(false);
                    if (result.name) {
                        setAlert({
                            open: true,
                            message: `Tank : ${result.name} have successfully ${!!edit ? "updated" : "created"}`,
                            severity: 'success'
                        });
                        setTank({data: result});
                        if (!edit) {
                            history.push('/');
                        } else {
                            handleEditSuccess(result);
                        }
                        return null;
                    } else if (result.statusCode === 400) {
                        setName({value: name.value, error: true, helperText: result.message})
                    } else {
                        setAlert({
                            open: true,
                            message: `An error occurred: ${result.message}`,
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
    };

    const handleOnDelete = () => {
        setLoading(true);
        fetch(process.env.REACT_APP_API_URL + '/tanks' + (!!edit ? `/${edit.id}` : ""), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + auth.token
            },
            body: JSON.stringify({name: name.value})
        })
            .then(res => {
                if (res.status === 200) {
                    handleEditSuccess(edit, true);
                    setAlert({
                        open: true,
                        message: `Tank ${edit.name} has been deleted`,
                        severity: 'success'
                    });

                } else {
                    setAlert({
                        open: true,
                        message: `An error occurred`,
                        severity: 'error'
                    });
                }

                setIsOpenDeleteModal(false);
                setLoading(false);
            });
    };

    return (
        <GridContainerResponsive fullHeightSmall>
            <form onSubmit={onSubmit} className={classes.form}>
                <TypographyResponsive overrideClasses={{root: classes.typography}}>
                    {!!edit ? "Update tank" : "Add Tank"}
                </TypographyResponsive>
                <Divider/>
                <div className={classes.fields}>
                    <TextField
                        margin="dense"
                        label="Name"
                        fullWidth
                        autoFocus
                        value={name.value}
                        onChange={e => {
                            setName({value: e.target.value, error: false, helperText: false});
                        }}
                        error={name.error}
                        helperText={name.helperText}
                    />
                </div>
                <Divider/>
                <div className={classes.actions}>
                    <Button
                        disabled={name.error || loading}
                        variant="contained"
                        color="primary"
                        type="submit"
                    >
                        {!!edit ? "Save" : "Create"} {loading && (<CircularProgress size={25}/>)}
                    </Button>
                    <Button
                        onClick={handleClose}
                        disabled={loading}
                        variant="contained"
                    >
                        Cancel {loading && (<CircularProgress size={25}/>)}
                    </Button>
                    {!!edit && (<Button
                        color="secondary"
                        onClick={() => setIsOpenDeleteModal(true)}
                        disabled={loading}
                        variant="contained"
                    >
                        Remove {loading && (<CircularProgress size={25}/>)}
                    </Button>)}
                </div>
                {!!edit && (<DeleteModal
                    open={openDeleteModal}
                    setOpen={setIsOpenDeleteModal}
                    name={edit.name}
                    onDelete={handleOnDelete}
                />)}
            </form>
        </GridContainerResponsive>
    )
};
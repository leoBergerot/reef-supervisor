import React, {useContext, useEffect, useRef, useState} from "react";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import {alertContext} from "../../contexts/alert-context";
import {authContext} from "../../contexts/auth-context";
import {tankContext} from "../../contexts/tank-context";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import {TypographyResponsive} from "../common/typography-responsive";
import Divider from "@material-ui/core/Divider";
import isEmpty from "validator/lib/isEmpty";
import {DeleteModal} from "../common/delete-modal";
import CardMedia from "@material-ui/core/CardMedia";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPen} from "@fortawesome/free-solid-svg-icons";
import CardActionArea from "@material-ui/core/CardActionArea";
import defaultAvatar from "../../../asset/images/default_avatar.svg";

const useStyles = makeStyles((theme) => createStyles({
    root: {
        overflow: "scroll",
        position: "fixed",
        right: 0,
        left:0,
        [theme.breakpoints.up("xs")]: {
            top: "64px",
        },
        [theme.breakpoints.down("xs")]: {
            top: "56px",
        },
        bottom: 0,
        top: 0,
        height: "inherit",
        backgroundColor: "#fff"
    },
    form: {
        [theme.breakpoints.up("xs")]: {
            margin: "0 20vw 0 20vw",
        },
        [theme.breakpoints.down("xs")]: {
            margin: "0 4vw 0 4vw",
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
        margin: "1rem 0",
        display: "flex"
    },
    actions: {
        margin: "1rem 0",
        "& button:not(:first-child)": {
            marginLeft: "1rem"
        }
    },
    avatar: {
        position: "relative",
        marginRight: "1rem",
    },
    img: {
        height: "10vw",
        width: "10vw",
        maxWidth: "200px",
        minWidth: "84px",
        minHeight: "84px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    edit: {
        color: "#FFF",
        position: "absolute",
        top: "93%",
        left: "7%",
        transform: "translate(-7%, -93%)",
        fontSize: "0.65rem",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: "0.3rem",
        borderRadius: "50rem",
        border: "1px solid white",
        filter: "drop-shadow(1px 1px 2px #000)"
    }
}));
export const Form = ({history, handleClose, edit, handleEditSuccess}) => {
    const {auth} = useContext(authContext);
    const {setTank} = useContext(tankContext);
    const {setAlert} = useContext(alertContext);

    const [name, setName] = useState({value: (!!edit ? edit.name : ""), error: false, helperText: null});
    const [loading, setLoading] = useState(false);

    const [avatar, setAvatar] = useState({url: null, blob: null, update: false});
    const inputFile = useRef(null);

    const [openDeleteModal, setIsOpenDeleteModal] = useState(false);

    const classes = useStyles();
    useEffect(() => {
        if (edit) {
            fetch(`${process.env.REACT_APP_API_URL}/tanks/${edit.id}/avatars`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + auth.token
                },
            })
                .then(res => {
                    if (res.status === 200) {
                        res.blob().then(blob => {
                            setAvatar({update: false, url: URL.createObjectURL(blob), blob: null})
                        })
                    }
                });
        }
    }, [edit]);

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
                        //update avatar
                        if (avatar.blob && avatar.update) {
                            const formData = new FormData();
                            formData.append("file", avatar.blob);
                            fetch(`${process.env.REACT_APP_API_URL}/tanks/${result.id}/avatars`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': 'Bearer ' + auth.token
                                },
                                body: formData
                            }).then(
                                res => {
                                    if (res.status === 200) {
                                        setAlert({
                                            open: true,
                                            message: `Tank : ${result.name} have successfully ${!!edit ? "updated" : "created"}`,
                                            severity: 'success'
                                        });
                                        if (!edit) {
                                            setTank({data: result});
                                            history.push('/');
                                        } else {
                                            result.avatar = avatar.blob;
                                            handleEditSuccess(result);
                                        }
                                    }
                                }
                            )
                        } else {
                            setAlert({
                                open: true,
                                message: `Tank : ${result.name} have successfully ${!!edit ? "updated" : "created"}`,
                                severity: 'success'
                            });
                            if (!edit) {
                                setTank({data: result});
                                history.push('/');
                            } else {
                                handleEditSuccess(result);
                            }
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

    const handleClickAvatar = () => {
        inputFile.current.click()
    };

    return (
        <div className={classes.root}>
            <form onSubmit={onSubmit} className={classes.form}>
                <TypographyResponsive overrideClasses={{root: classes.typography}}>
                    {!!edit ? "Update tank" : "Add Tank"}
                </TypographyResponsive>
                <Divider/>
                <div className={classes.fields}>
                    <div className={classes.avatar}>
                        <CardActionArea
                            onClick={handleClickAvatar}
                        >
                            <CardMedia
                                className={classes.img}
                                src={avatar.url ? avatar.url : defaultAvatar}
                                component="img"
                            >
                            </CardMedia>
                            <div className={classes.edit}>
                                <FontAwesomeIcon icon={faPen}/>
                            </div>
                            <input
                                style={{display: "none"}}
                                onChange={(event => {
                                        setAvatar({
                                            url: URL.createObjectURL(event.target.files[0]),
                                            blob: event.target.files[0],
                                            update: true
                                        })
                                    }
                                )}
                                type="file"
                                ref={inputFile}/>
                        </CardActionArea>
                    </div>
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
        </div>
    )
};
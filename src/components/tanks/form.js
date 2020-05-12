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
import {appFetch, DELETE, GET, PATCH, POST} from "../../utils/app-fetch";
import {useTranslation} from "react-i18next";

const useStyles = makeStyles((theme) => createStyles({
    root: {
        backgroundColor: "#FFF",
        width: "100%",
        height: "100%"
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
    const {getAuthToken} = useContext(authContext);
    const {setTankData, tank} = useContext(tankContext);
    const {setAlert} = useContext(alertContext);
    const {t} = useTranslation();

    const [name, setName] = useState({value: (!!edit ? edit.name : ""), error: false, helperText: null});
    const [loading, setLoading] = useState(false);

    const [avatar, setAvatar] = useState({url: null, blob: null, update: false});
    const inputFile = useRef(null);

    const [openDeleteModal, setIsOpenDeleteModal] = useState(false);

    const classes = useStyles();
    useEffect(() => {
        if (edit && edit.avatar) {
            appFetch(
                GET,
                `tanks/${edit.id}/avatars`,
                null,
                getAuthToken(),
                blob => {
                    setAvatar({update: false, url: URL.createObjectURL(blob), blob: null})
                },
                null,
                setAlert,
                true
            );
        }
    }, [edit]);

    const onSubmit = (event) => {
        event.preventDefault();
        let error = false;
        if (isEmpty(name.value)) {
            setName({value: "", error: true, helperText: t('tanks.form.error.name.no')});
            error = true;
        }

        if (error) {
            return;
        }
        appFetch(
            !!edit ? PATCH : POST,
            `tanks${!!edit ? `/${edit.id}` : ''}`,
            {name: name.value},
            getAuthToken(),
            (result) => {
                setLoading(false);
                if (result.name) {
                    //update avatar
                    if (avatar.blob && avatar.update) {
                        const formData = new FormData();
                        formData.append("file", avatar.blob);
                        appFetch(
                            PATCH,
                            `tanks/${result.id}/avatars`,
                            formData,
                            getAuthToken(),
                            (result) => {
                                setAlert({
                                    open: true,
                                    message: !!edit ? t('tanks.form.edit.success', {
                                        name: result.name,
                                    }) : t('tanks.form.create.success', {
                                        name: result.name,
                                    }),
                                    severity: 'success'
                                });
                                if (!edit) {
                                    setTankData(result);
                                    history.push('/');
                                } else {
                                    result.avatar = avatar.blob;
                                    handleEditSuccess(result);
                                }
                            },
                            null,
                            setAlert
                        )
                    } else {
                        setAlert({
                            open: true,
                            message: !!edit ? t('tanks.form.edit.success', {
                                name: result.name,
                            }) : t('tanks.form.create.success', {
                                name: result.name,
                            }),
                            severity: 'success'
                        });
                        if (!edit) {
                            setTankData(result);
                            history.push('/');
                            return null;
                        } else {
                            handleEditSuccess(result);
                        }
                    }
                    return null;
                }
            },
            error => {
                if (error && error.statusCode === 400) {
                    setName({value: name.value, error: true, helperText: error.message})
                }
            }
        );
    };

    const handleDelete = () => {
        setLoading(true);
        setIsOpenDeleteModal(false);
        appFetch(
            DELETE,
            `tanks/${edit.id}`,
            null,
            getAuthToken(),
            () => {
                setLoading(false);
                handleEditSuccess(edit, true);
                setAlert({
                    open: true,
                    message: t('tanks.form.deleted', {name: edit.name}),
                    severity: 'success'
                });
                
                if(tank.data.id === edit.id){
                    setTankData(null);
                }
            },
            () => {
                setLoading(false);
            },
            setAlert
        )
    };

    const handleClickAvatar = () => {
        inputFile.current.click()
    };

    return (
        <div className={classes.root}>
            <form onSubmit={onSubmit} className={classes.form}>
                <TypographyResponsive overrideClasses={{root: classes.typography}}>
                    {!!edit ? t('tanks.form.edit.title') : t('tanks.form.create.title')}
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
                        label={t('tanks.form.inputs.name')}
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
                        size="small"
                        color="primary"
                        type="submit"
                    >
                        {!!edit ? t('tanks.form.edit.button') : t('tanks.form.create.button')}
                    </Button>
                    <Button
                        size="small"
                        onClick={handleClose}
                        disabled={loading}
                        variant="contained"
                    >
                        {t('tanks.form.cancel')} {loading && (<CircularProgress size={25}/>)}
                    </Button>
                    {!!edit && (<Button
                        size="small"
                        color="secondary"
                        onClick={() => setIsOpenDeleteModal(true)}
                        disabled={loading}
                        variant="contained"
                    >
                        {t('tanks.form.delete')} {loading && (<CircularProgress size={25}/>)}
                    </Button>)}
                    {loading && (<CircularProgress size={25}/>)}
                </div>
                {!!edit && (<DeleteModal
                    open={openDeleteModal}
                    setOpen={setIsOpenDeleteModal}
                    name={t('tanks.form.deleted_name', {name: edit.name})}
                    onDelete={handleDelete}
                />)}
            </form>
        </div>
    )
};
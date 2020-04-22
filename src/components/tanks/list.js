import React, {useContext, useEffect, useState} from "react";
import {GridContainerResponsive} from "../common/grid-container-reponsive";
import {Card} from "./card";
import {makeStyles} from "@material-ui/core/styles";
import {AddButton} from "./add-button";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import {CircularProgress} from "@material-ui/core";
import {TypographyResponsive} from "../common/typography-responsive";
import Modal from "@material-ui/core/Modal";
import {Form} from "./form";
import {tankContext} from "../../contexts/tank-context";
import Button from "@material-ui/core/Button";

const useStyles = makeStyles((theme) => ({
    list: {
        maxWidth: "80%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
    },
    listTank: {
        display: "flex",
        flexWrap: "wrap",
        alignContent: "center",
        justifyContent: "center",
        [theme.breakpoints.up("sm")]: {
            margin: '2em 0',
        },
        [theme.breakpoints.down("sm")]: {
            margin: '1em 0',
        }
    },
    typography: {
        textAlign: "center",
        [theme.breakpoints.up("sm")]: {
            fontSize: '4vw !important'
        },
        [theme.breakpoints.down("sm")]: {
            fontSize: '7vw'
        }
    },
    modal: {
        [theme.breakpoints.down("sm")]: {
            top: "56px !important",
        },
        [theme.breakpoints.up("sm")]: {
            top: "64px !important",
        },
        "& div:first-child ": {
            backgroundColor: "transparent !important"
        },
    }
}));

export const List = ({history, match: {params: {manage}}}) => {
    const {auth} = useContext(authContext);
    const {setAlert} = useContext(alertContext);
    const {setTank} = useContext(tankContext);

    const classes = useStyles();

    const [open, setOpen] = useState(false);
    const [tankList, setTankList] = useState({loading: true, data: []});

    const [tankEdit, setTankEdit] = useState({data: null});
    const [updateList, setUpdateList] = useState(true);

    useEffect(() => {
        if (updateList) {
            fetch(process.env.REACT_APP_API_URL + '/tanks', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + auth.token
                },
            })
                .then(res => res.json())
                .then(
                    (result) => {
                        setTankList({data: result, loading: false});
                    },
                    (error) => {
                        setTankList({loading: false, data: []});
                        setAlert({
                            open: true,
                            message: `An error occurred`,
                            severity: 'error'
                        });
                    }
                );
            setUpdateList(false)
        }
    }, [updateList]);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        if (!!manage) {
            setTankEdit({data: null})
        }
    };

    const handleClick = (data) => {
        if (!manage) {
            setTank({data: data});
            history.push('/')
        } else {
            handleOpen();
            setTankEdit({data: data})
        }
    };

    const handleEditSuccess = (result, remove = false) => {
        handleClose();
        let data = [];
        if (!remove) {
            data = tankList.data.map((value) => {
                if (value.id === result.id) {
                    value.name = result.name;
                    value.avatar = result.avatar;
                }
                return value
            });
        } else {
            data = tankList.data.filter((value) => {
                return value.id !== result.id;
            })
        }

        setTankList({
            data: data
            , loading: false
        });
        setUpdateList(true);
    };

    const handleManageFinish = () => {
        history.push("/")
    };

    return (
        <GridContainerResponsive>
            {!tankList.loading ?
                <div className={classes.list}>
                    <TypographyResponsive overrideClasses={{root: classes.typography}}>
                        {manage ? "Manage tanks :" : "Choice your tank :"}
                    </TypographyResponsive>
                    <div className={classes.listTank}>
                        {tankList.data.map((tank) => (
                            <Card edit={!!manage} key={tank.id} data={tank}
                                  handleClick={handleClick}/>
                        ))}
                        <AddButton onClick={handleOpen}/>
                    </div>
                    {!!manage && (
                        <Button
                            style={{margin: "0 2vw 2vh 0"}}
                            onClick={handleManageFinish}
                            variant="contained"
                        >
                            Finish
                        </Button>
                    )}
                </div>
                : <CircularProgress/>}
            <Modal
                className={classes.modal}
                open={open}
                onClose={handleClose}
            >
                <Form handleClose={handleClose} history={history} edit={tankEdit.data}
                      handleEditSuccess={handleEditSuccess}/>
            </Modal>
        </GridContainerResponsive>
    )
};
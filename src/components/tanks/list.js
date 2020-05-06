import React, {useContext, useEffect, useState} from "react";
import {GridContainerResponsive} from "../common/grid-container-reponsive";
import {Card} from "./card";
import {makeStyles} from "@material-ui/core/styles";
import {AddButton} from "./add-button";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import {CircularProgress} from "@material-ui/core";
import {TypographyResponsive} from "../common/typography-responsive";
import {tankContext} from "../../contexts/tank-context";
import Button from "@material-ui/core/Button";
import FormModal from "./modal";
import {appFetch, GET} from "../../utils/app-fetch";

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
            appFetch(
                GET,
                'tanks',
                null,
                auth.token,
                (result) => (
                    setTankList({data: result, loading: false})
                ),
                () => {
                    setTankList({loading: false, data: []});
                },
                setAlert
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
        <GridContainerResponsive fullHeight>
            {!tankList.loading ?
                <div className={classes.list}>
                    <TypographyResponsive overrideClasses={{root: classes.typography}}>
                        {manage ? "Manage tanks :" : (tankList.data.length === 0 ? "Create your first tank to continue :" : "Choose your tank :")}
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
            <FormModal handleClose={handleClose} history={history} handleEditSuccess={handleEditSuccess}
                       tankEdit={tankEdit} open={open}/>
        </GridContainerResponsive>
    )
};
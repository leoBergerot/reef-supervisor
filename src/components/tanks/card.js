import React, {useContext, useEffect, useState} from "react";
import {makeStyles} from "@material-ui/core/styles";
import {TypographyResponsive} from "../common/typography-responsive";
import {CardActionArea, CircularProgress} from "@material-ui/core";
import {default as CardMu} from "@material-ui/core/Card"
import CardMedia from "@material-ui/core/CardMedia";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPen} from "@fortawesome/free-solid-svg-icons";
import {authContext} from "../../contexts/auth-context";
import defaultAvatar from "../../../asset/images/default_avatar.svg";
import {appFetch, GET} from "../../utils/app-fetch";
import {alertContext} from "../../contexts/alert-context";

const useStyles = makeStyles((theme) => ({
    root: {
        width: "10vw",
        maxWidth: "200px",
        minWidth: "84px",
        margin: "0 2vw 2vh 0",
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
        filter: edit => `brightness(${edit ? 80 : 100}%)`
    },
    edit: {
        color: "#FFF",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        [theme.breakpoints.up("xs")]: {
            fontSize: "3vw"

        },
        [theme.breakpoints.down("xs")]: {
            fontSize: "6vw"
        }
    }
}));
export const Card = ({data, edit, handleClick}) => {

    const {getAuthToken} = useContext(authContext);
    const {setAlert} = useContext(alertContext);

    const classes = useStyles(edit);
    const [avatar, setAvatar] = useState({loading: true, blob: null});
    useEffect(() => {
        if (data.avatar) {
            appFetch(
                GET,
                `tanks/${data.id}/avatars`,
                null,
                getAuthToken(),
                (blob) => (
                    setAvatar({loading: false, blob: URL.createObjectURL(blob)})
                ),
                () => (setAvatar({loading: false, blob: null})),
                setAlert,
                true
            );
        } else {
            setAvatar({loading: false, blob: null});
        }
    }, [data]);
    return (
        <CardMu className={classes.root}>
            <CardActionArea onClick={() => handleClick(data)}>
                <div style={{position: "relative"}}>
                    {!avatar.loading ?
                        <CardMedia className={classes.img}
                                   src={avatar.blob ? avatar.blob : defaultAvatar}
                                   component="img"
                        >
                        </CardMedia>
                        :
                        <CardMedia className={classes.img}
                                   component="div"
                        >
                            <CircularProgress size={25}/>
                        </CardMedia>}
                    {edit && (
                        <div className={classes.edit}>
                            <FontAwesomeIcon icon={faPen}/>
                        </div>
                    )}
                </div>
                <TypographyResponsive>
                    {data.name}
                </TypographyResponsive>
            </CardActionArea>
        </CardMu>
    )
};
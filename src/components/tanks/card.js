import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import {TypographyResponsive} from "../common/typography-responsive";
import {CardActionArea} from "@material-ui/core";
import {default as CardMu} from "@material-ui/core/Card"
import CardMedia from "@material-ui/core/CardMedia";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPen} from "@fortawesome/free-solid-svg-icons";


const useStyles = makeStyles(theme => ({
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
export const Card = ({data, history, edit, handleClick}) => {
    const classes = useStyles();

    return (
        <CardMu className={classes.root}>
            <CardActionArea onClick={() => handleClick(data)}>
                <div style={{position: "relative"}}>
                    <CardMedia className={classes.img}
                               src="https://cdn.pixabay.com/photo/2016/05/14/11/54/anemone-1391724_1280.jpg"
                               component="img"
                    >
                    </CardMedia>
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
import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import {TypographyResponsive} from "../common/typography-responsive";
import {CardActionArea} from "@material-ui/core";
import {default as CardMu} from "@material-ui/core/Card"
import CardMedia from "@material-ui/core/CardMedia";


const useStyles = makeStyles({
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
});
export const Card = ({name, img}) => {

    const classes = useStyles();
    return (
        <CardMu className={classes.root}>
            <CardActionArea>
                <CardMedia className={classes.img}
                           src="https://cdn.pixabay.com/photo/2016/05/14/11/54/anemone-1391724_1280.jpg"
                           component="img"
                >
                </CardMedia>
                <TypographyResponsive>
                    {name}
                </TypographyResponsive>
            </CardActionArea>
        </CardMu>
    )
};
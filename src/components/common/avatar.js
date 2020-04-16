import React from "react";
import {default as AvatarUi} from "@material-ui/core/Avatar";
import makeStyles from "@material-ui/core/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
    small:{
        width: "10vw",
        height: "10vw",
        maxHeight: "40px",
        maxWidth: "40px",
        minHeight: "30px",
        minWidth: "30px",
        padding: "0.2rem",
    },
    large: {
        width: "10vw",
        height: "10vw",
        maxHeight: "51px",
        maxWidth: "51px",
        minHeight: "43px",
        minWidth: "43px",
        padding: "0.2rem",
    },
}));

export const Avatar = ({src, small}) => {
    const classes = useStyles();
    return (
        <AvatarUi src={src} variant="square" className={small ? classes.small : classes.large}/>
    )
};
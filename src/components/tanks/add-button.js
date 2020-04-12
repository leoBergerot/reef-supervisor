import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import {TypographyResponsive} from "../common/typography-responsive";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faPlus} from '@fortawesome/free-solid-svg-icons'
import ButtonBase from "@material-ui/core/ButtonBase";

const useStyles = makeStyles((theme) => (
    {
        root: {
            width: "10vw",
            maxWidth: "200px",
            minWidth: "84px",
            margin: "0 2vw 2vh 0",
            display: "flex",
            flexDirection: "column",
            '&:hover, &$focusVisible': {
                '& $icon': {
                    color: "#FFF"
                },
                '& $circleAdd': {
                    backgroundColor: "#808080",
                },
                '& $typography': {
                    color: "#808080",
                }
            }
        },
        focusVisible: {},
        icon: {
            [theme.breakpoints.up("sm")]: {
                fontSize: "3vw",
            },
            [theme.breakpoints.down("sm")]: {
                fontSize: "20px",

            }
        },
        circleAdd: {
            margin: "auto",
            width: "min-content",
            padding: "1.5vw",
            borderRadius: "1vh"
        },
        typography: {
            textAlign: "center",
            [theme.breakpoints.up("sm")]: {
                fontSize: '1.3vw'
            },
            [theme.breakpoints.down("sm")]: {
                fontSize: '12px'
            }
        }
    }))
;
export const AddButton = () => {

    const classes = useStyles();
    return (

        <ButtonBase
            disableTouchRipple
            aria-label="add tank"
            className={classes.root}
            focusVisibleClassName={classes.focusVisible}

        >
            <div className={classes.circleAdd}>
                <FontAwesomeIcon icon={faPlus} className={classes.icon}/>
            </div>
            <TypographyResponsive overrideClasses={{root: classes.typography}}>
                Add tank
            </TypographyResponsive>
        </ButtonBase>
    )
};
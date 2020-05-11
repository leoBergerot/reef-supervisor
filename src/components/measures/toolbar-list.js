import {makeStyles} from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import React from "react";
import {useTranslation} from "react-i18next";

const useToolbarStyles = makeStyles((theme) => ({
    title: {
        flex: '1 1 100%',
    }
}));

export const ToolbarList = ({type}) => {
    const classes = useToolbarStyles();
    const {t} = useTranslation();

    return (
        <Toolbar>
            <Typography variant="overline" className={classes.title}>
                {t('measure.list.toolbar.title', {name: t(`measure.parameter.${type.data.name}`)})}
            </Typography>
        </Toolbar>
    );
};
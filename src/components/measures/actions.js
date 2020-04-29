import React from "react";
import IconButton from "@material-ui/core/IconButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPen, faSave, faTimes, faTrashAlt} from "@fortawesome/free-solid-svg-icons";
import {makeStyles} from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    margin: {
        margin: theme.spacing(1)
    }
}));

export const Actions = ({edit, setEdit, handleSave, handleDelete, disabled}) => {
    const classes = useStyles();

    const handleEdit = () => {
        setEdit(true)
    };

    const handleCancel = () => {
        setEdit(false)
    };

    return (
        !edit ?
            <>
                <IconButton aria-label="edit"
                            size="small"
                            className={classes.margin}
                            disabled={disabled}
                            onClick={handleEdit}
                >
                    <FontAwesomeIcon icon={faPen}/>
                </IconButton>
                <IconButton aria-label="delete"
                            color="secondary"
                            size="small"
                            className={classes.margin}
                            disabled={disabled}
                            onClick={handleDelete}
                >
                    <FontAwesomeIcon icon={faTrashAlt}/>
                </IconButton>
            </>
            :
            <>
                <IconButton aria-label="save"
                            size="small"
                            className={classes.margin}
                            onClick={handleSave}
                >
                    <FontAwesomeIcon icon={faSave}/>
                </IconButton>
                <IconButton aria-label="cancel"
                            color="secondary"
                            size="small"
                            className={classes.margin}
                            onClick={handleCancel}
                >
                    <FontAwesomeIcon icon={faTimes}/>
                </IconButton>
            </>
    )
}
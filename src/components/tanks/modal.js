import Modal from "@material-ui/core/Modal";
import {Form} from "./form";
import React from "react";
import {makeStyles} from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    modal: {
        position: "absolute !important",
        "& > div": {
            position: "absolute !important",
        }
    }
}));

export default function FormModal({handleClose, handleEditSuccess, tankEdit, open, history}) {
    const classes = useStyles();
    const body = (
        <>
            <Form handleClose={handleClose} history={history} edit={tankEdit.data}
                  handleEditSuccess={handleEditSuccess}/>
        </>
    );
    return (
        <Modal
            disablePortal={true}
            className={classes.modal}
            open={open}
            onClose={handleClose}
        >
            {body}
        </Modal>
    )
}
import React, {useEffect, useState} from "react";
import {Modal} from "@material-ui/core";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import CardActions from "@material-ui/core/CardActions";
import Button from "@material-ui/core/Button";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {useTranslation} from "react-i18next";

const useStyles = makeStyles((theme) => ({
    modal: {
        display: 'flex',
        padding: theme.spacing(1),
        alignItems: 'center',
        justifyContent: 'center',
    }
}));

export const DeleteModal = ({open, name, onDelete, setOpen, unDisplayLinked}) => {

        const [isOpen, setIsOpen] = useState(false);

        const classes = useStyles();
    const {t} = useTranslation();

        useEffect(() => {
            setIsOpen(open);
        }, [open]);

        useEffect(() => {
            setOpen(isOpen)
        }, [isOpen]);

        return (
            <Modal open={isOpen}
                   onClose={() => setIsOpen(!open)}
                   className={classes.modal}
            >
                <Card>
                    <CardContent>
                        <Typography variant="h5">
                            {t('delete_modal.title', {name})}
                        </Typography>
                        {!unDisplayLinked && (<Typography variant="body2" color="error">
                            {t('delete_modal.warning')}
                        </Typography>)}
                    </CardContent>
                    <CardActions>
                        <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            onClick={onDelete}
                        >
                            {t('delete_modal.delete')}
                        </Button>
                        <Button
                            size="small"
                            color="secondary"
                            variant="contained"
                            onClick={() => setIsOpen(!open)}
                        >
                            {t('delete_modal.cancel')}
                        </Button>
                    </CardActions>
                </Card>
            </Modal>
        )
    }
;
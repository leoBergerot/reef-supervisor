import React, {useContext, useEffect, useState} from "react";
import Popover from "@material-ui/core/Popover";
import makeStyles from "@material-ui/core/styles/makeStyles";
import IconButton from "@material-ui/core/IconButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faTimes} from "@fortawesome/free-solid-svg-icons";
import Grid from "@material-ui/core/Grid";
import {tankContext} from "../../contexts/tank-context";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import isEmpty from "validator/es/lib/isEmpty";
import {MuiPickersContext} from "@material-ui/pickers";
import {DatePicker} from "../common/date-picker";
import {MeasureField} from "../common/measure-field";
import {appFetch, POST} from "../../utils/app-fetch";

const useStyles = makeStyles(theme => ({
    form: {
        height: size => size.size,
        width: size => size.size,
    },
    fields: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        [theme.breakpoints.up("xs")]: {
            '& div': {
                fontSize: "1.1em"
            },
            padding: "1rem",
        },
        [theme.breakpoints.down("xs")]: {
            '& div': {
                fontSize: "1em",
            },
            padding: "0.3rem",
        },
        [theme.breakpoints.up("md")]: {
            '& div': {
                fontSize: "1.3em"
            },
            padding: "1.5rem",
        },
    }
}));

export const AddFormWithRef = React.forwardRef((props, ref) => <AddForm innerRef={ref} {...props} />);

const AddForm = ({open, handleClose, anchorEl, id, defaultValue, name, unit, size, type, measure, setMeasure}) => {

    const {moment} = useContext(MuiPickersContext);
    const {getAuthToken} = useContext(authContext);
    const {tank} = useContext(tankContext);
    const {setAlert} = useContext(alertContext);

    const [value, setValue] = useState({value: defaultValue, error: false, helperText: null});
    const [createdAt, setCreatedAt] = useState({value: moment(), error: false});

    const classes = useStyles({size});

    useEffect(() => {
        if (open) {
            setCreatedAt({value: moment(), error: false});
            setValue({value: defaultValue, error: false, helperText: null});
        }

    }, [open]);

    const handleChange = (event) => {
        setValue({
            value: value.value, error: false, helperText: null,
            [event.target.name]: event.target.value,
        });
    };

    const handleDateChange = (date) => {
        setCreatedAt({value: date, error: false})
    };

    const handleValidate = (event) => {
        event.preventDefault();
        let error = false;
        if (isEmpty(value.value)) {
            setValue({value: value.value, error: true, helperText: "Please enter a correct value"});
            error = true;
        }

        if (!error) {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        handleClose();
        setMeasure({loading: true, last: measure.last, previous: measure.previous});

        appFetch(
            POST,
            'measures',
            {
                tank: tank.data.id,
                type: type,
                value: value.value,
                createdAt: createdAt.value,
            },
            getAuthToken(),
            (result) => (setMeasure({loading: false, last: result, previous: measure.last})),
            () => (setMeasure({loading: false, last: measure.last, previous: measure.previous})),
            setAlert
        );
    };

    return (
        <Popover
            id={id}
            open={open}
            disablePortal={true}
            marginThreshold={0}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'center',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'center',
                horizontal: 'center',
            }}
        >
            <form className={classes.form}>
                <div className={classes.fields}>
                    <MeasureField
                        label={`${name} value`}
                        value={value.value}
                        error={value.error}
                        helperText={value.helperText}
                        placeholder={unit}
                        onChange={handleChange}
                        name="value"
                        id="value"
                    />
                    <DatePicker selectedDate={createdAt.value} handleDateChange={handleDateChange}/>
                    <Grid
                        container
                        direction="row"
                        justify="space-around"
                    >
                        <IconButton color="secondary" aria-label={`Cancel measure ${name}`} component="span"
                                    onClick={handleClose}>
                            <FontAwesomeIcon icon={faTimes}/>
                        </IconButton>
                        <IconButton type="submit" color="primary" aria-label={`Validate measure ${name}`}
                                    onClick={handleValidate}>
                            <FontAwesomeIcon icon={faCheck}/>
                        </IconButton>
                    </Grid>
                </div>
            </form>
        </Popover>
    )
};
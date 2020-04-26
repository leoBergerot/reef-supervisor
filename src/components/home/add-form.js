import React, {useState} from "react";
import Popover from "@material-ui/core/Popover";
import TextField from "@material-ui/core/TextField";
import NumberFormat from 'react-number-format';
import makeStyles from "@material-ui/core/styles/makeStyles";
import {KeyboardDateTimePicker} from '@material-ui/pickers';
import IconButton from "@material-ui/core/IconButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faTimes} from "@fortawesome/free-solid-svg-icons";
import Grid from "@material-ui/core/Grid";

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
            '& button': {
                padding: "2px"
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

const AddForm = ({open, handleClose, anchorEl, id, defaultValue, name, unit, size}) => {

    const [value, setValue] = useState({value: defaultValue, error: false, helperText: null});
    const [createdAt, setCreatedAt] = useState({value: new Date(), error: false});

    const classes = useStyles({size});

    const handleChange = (event) => {
        setValue({
            ...value,
            [event.target.name]: event.target.value,
        });
    };

    const handleDateChange = (date) => {
        setCreatedAt({value: date, error: false})
    };

    const handleValidate = (event) => {
        event.preventDefault();
        console.log("Todo check form values and send")
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
                    <TextField
                        fullWidth
                        label={`${name} value`}
                        value={value.value}
                        placeholder={unit}
                        onChange={handleChange}
                        name="value"
                        id="value"
                        InputProps={{
                            inputComponent: NumberFormatCustom,
                        }}
                    />
                    <>
                        <KeyboardDateTimePicker
                            variant="inline"
                            format="DD/MM/YY HH:mm"
                            margin="normal"
                            id="date"
                            label="Date"
                            value={createdAt.value}
                            onChange={handleDateChange}
                            onError={() => {
                                createdAt.error = true
                            }}
                            KeyboardButtonProps={{
                                'aria-label': 'change date',
                            }}
                        />
                    </>
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

function NumberFormatCustom(props) {
    const {inputRef, onChange, placeholder, ...other} = props;
    return (
        <NumberFormat
            {...other}
            getInputRef={inputRef}
            onValueChange={(value) => {
                onChange({
                    target: {
                        name: props.name,
                        value: value.value,
                    },
                });
            }}
            isNumericString
            allowNegative={false}
            thousandSeparator=" "
            decimalScale
            suffix={` ${placeholder}`}
        />
    );
}

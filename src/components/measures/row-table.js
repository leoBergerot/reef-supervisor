import React, {useContext, useEffect, useState} from "react";
import {default as TableRowUi} from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell/TableCell";
import {Actions} from "./actions";
import {MeasureField} from "../common/measure-field";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import {Skeleton} from "@material-ui/lab";
import {DatePicker} from "../common/date-picker";
import isEmpty from "validator/es/lib/isEmpty";
import {appFetch, PATCH} from "../../utils/app-fetch";
import {useTranslation} from "react-i18next";

export const TableRow = ({moment, index, row, unit, handleDelete}) => {
    const {getAuthToken} = useContext(authContext);
    const {setAlert} = useContext(alertContext);
    const {t} = useTranslation();

    const [edit, setEdit] = useState(false);
    const [selectedDate, handleChangeDate] = useState({value: moment(row.createdAt), error: false, helperText: null});
    const [value, setValue] = useState({value: row.value, error: false});
    const [loading, setLoading] = useState(false);
    const [currentValues, setCurrentValues] = useState({createdAt: moment(row.createdAt), value: row.value});

    useEffect(() => {
        if (!edit) {
            handleChangeDate({value: currentValues.createdAt, error: false, helperText: null});
            setValue({value: currentValues.value, error: false});
        }

    }, [edit]);

    useEffect(() => {
        handleChangeDate({value: currentValues.createdAt, error: false, helperText: null});
        setValue({value: currentValues.value, error: false});
    }, [currentValues]);

    const _handleDelete = () => {
        handleDelete(
            row.id,
            moment(currentValues.createdAt).format("DD/MM/YY HH:mm"),
            () => (setLoading(true))
        )
    };

    const handleSave = (event) => {
        event.preventDefault();
        let error = false;
        if (isEmpty(value.value.toString())) {
            setValue({
                value: value.value,
                error: true,
                helperText: t('measure.list.form.error.value')
            });
            error = true;
        }
        if (!error && !selectedDate.error) {
            setEdit(false);
            setLoading(true);
            appFetch(
                PATCH,
                `measures/${row.id}`,
                {
                    value: value.value,
                    createdAt: selectedDate.value,
                },
                getAuthToken(),
                (result) => {
                    setCurrentValues({value: result.value, createdAt: result.createdAt})
                    setAlert({
                        open: true,
                        message: t('measure.list.form.success'),
                        severity: 'success'
                    });
                    setLoading(false);
                },
                () => (setLoading(false)),
                setAlert
            );
        }
    };

    return (
        <TableRowUi
            hover
            key={index}
        >
            {!edit ?
                !loading ?
                    <TableCell>
                        {moment(currentValues.createdAt).format('DD/MM/YY HH:mm')}
                    </TableCell> :
                    <TableCell>
                        <Skeleton/>
                    </TableCell>
                :
                <TableCell>
                    <DatePicker
                        selectedDate={selectedDate.value}
                        handleDateChange={(date) => handleChangeDate({value: date, error: false, helperText: null})}
                        error={selectedDate.error}
                        helperText={selectedDate.helperText}
                        onError={(error) => {
                            if (!selectedDate.error && error) {
                                handleChangeDate({
                                    value: selectedDate.value,
                                    error: true,
                                    helperText: t('measure.error.date')
                                })
                            }
                        }}
                        small
                    />
                </TableCell>
            }
            {!edit ?
                !loading ?
                    <TableCell>
                        <div style={{
                            minWidth: (6 + unit.length).toString() + 'ch',
                            width: "min-content",
                        }}>
                            {`${currentValues.value} ${unit}`}
                        </div>
                    </TableCell>
                    :
                    <TableCell>
                        <Skeleton/>
                    </TableCell>
                :
                <TableCell>
                    <div style={{
                        minWidth: (currentValues.value.toString().length + unit.length + (currentValues.value > 1000 ? 1 : 0)).toString() + 'ch',
                        width: "min-content",
                    }}>
                        <MeasureField
                            small
                            value={value.value}
                            error={value.error}
                            helperText={value.helperText}
                            placeholder={unit}
                            onChange={
                                (event) => setValue({
                                    value: value.value,
                                    error: event.target.value.toString().length <= 0,
                                    helperText: event.target.value.toString().length <= 0 ? t('measure.error.value') : null,
                                    [event.target.name]: event.target.value,
                                })
                            }
                            name="value"
                            id="value"
                        />
                    </div>
                </TableCell>
            }
            <TableCell>
                <Actions edit={edit}
                         setEdit={setEdit}
                         handleSave={handleSave}
                         disabled={loading || value.error || selectedDate.error}
                         handleDelete={_handleDelete}
                />
            </TableCell>
        </TableRowUi>
    )
};
import React from "react";
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Skeleton from "@material-ui/lab/Skeleton";

const headCells = [
    {id: 'createdAt',  label: 'Created at'},
    {id: 'value', label: 'Value'},
];

function EnhancedTableHead(props) {
    const {classes, order, orderBy, onRequestSort} = props;
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

EnhancedTableHead.propTypes = {
    classes: PropTypes.object.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
};

const useToolbarStyles = makeStyles((theme) => ({
    root: {
        // paddingLeft: theme.spacing(2),
        // paddingRight: theme.spacing(1),
    },
    title: {
        flex: '1 1 100%',
    }
}));

const EnhancedTableToolbar = ({type}) => {
    const classes = useToolbarStyles();

    return (
        <Toolbar
            className={classes.root}
        >
            <Typography variant="overline" className={classes.title}>
                {type.data.name} values list
            </Typography>
            {/*<Tooltip title="Filter list">*/}
            {/*    <IconButton aria-label="filter list">*/}
            {/*        <FilterListIcon/>*/}
            {/*    </IconButton>*/}
            {/*</Tooltip>*/}
        </Toolbar>
    );
};

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        position: "relative",
        height: "inherit"
    },
    table: {},
    visuallyHidden: {
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        top: 20,
        width: 1,
    },
    container: {
        maxHeight: "calc(100% - 108px)",
    }
}));

export default function EnhancedTable({type, page, setPage, setRowsPerPage, rowsPerPage, total, data, setOrder, setOrderBy, order, orderBy}) {
    const classes = useStyles();

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const emptyRows = !data.loading ? (rowsPerPage - data.data.length) : 5;

    return (
        <Paper className={classes.root}>
            <EnhancedTableToolbar type={type}/>
            <TableContainer className={classes.container}>
                <Table
                    stickyHeader
                    className={classes.table}
                    aria-labelledby="tableTitle"
                    aria-label="enhanced table"
                >
                    <EnhancedTableHead
                        classes={classes}
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
                    />
                    <TableBody>
                        {data.data
                            .map((row, index) => {
                                return (
                                    <TableRow
                                        hover
                                        key={index}
                                    >
                                        <TableCell id={index}>
                                            {row.createdAt}
                                        </TableCell>
                                        <TableCell>{row.value}</TableCell>
                                    </TableRow>
                                );
                            })}
                        {emptyRows > 0 && data.loading && (
                            Array.apply(null, Array(emptyRows)).map((value, index) =>
                                <TableRow key={index} style={{height: 33}}>
                                    <TableCell>
                                        <Skeleton/>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton/>
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
                style={{position: "absolute", bottom: 0, right: 0}}
            />
        </Paper>
    );
}
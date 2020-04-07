import React from "react"
import PropTypes from 'prop-types';

export const ContextProviderComposer = ({ contextProviders, children }) => {
    return contextProviders.reduceRight((children, parent) => React.cloneElement(parent, { children }), children)
};

ContextProviderComposer.propTypes = {
    contextProviders: PropTypes.arrayOf(
        PropTypes.element,
    ).isRequired,
    children: PropTypes.node.isRequired,
};
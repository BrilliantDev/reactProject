import * as React from 'react';
import PropTypes from 'prop-types';
import { useInput, FieldTitle } from 'ra-core';

import { CommonInputProps } from './CommonInputProps';
import {
    ResettableTextField,
    ResettableTextFieldProps,
} from './ResettableTextField';
import { InputHelperText } from './InputHelperText';
import { sanitizeInputRestProps } from './sanitizeInputRestProps';

/**
 * An Input component for a string
 *
 * @example
 * <TextInput source="first_name" />
 *
 * You can customize the `type` props (which defaults to "text").
 * Note that, due to a React bug, you should use `<NumberField>` instead of using type="number".
 * @example
 * <TextInput source="email" type="email" />
 * <NumberInput source="nb_views" />
 *
 * The object passed as `options` props is passed to the <ResettableTextField> component
 */
export const TextInput = (props: TextInputProps) => {
    const {
        label,
        format,
        helperText,
        onBlur,
        onFocus,
        onChange,
        parse,
        resource,
        source,
        validate,
        ...rest
    } = props;
    const {
        field,
        fieldState: { error, invalid, isTouched },
        formState: { isSubmitted },
        id,
        isRequired,
    } = useInput({
        format,
        parse,
        resource,
        source,
        type: 'text',
        validate,
        ...rest,
    });
    return (
        <ResettableTextField
            id={id}
            {...field}
            label={
                label !== '' &&
                label !== false && (
                    <FieldTitle
                        label={label}
                        source={source}
                        resource={resource}
                        isRequired={isRequired}
                    />
                )
            }
            error={(isTouched || isSubmitted) && invalid}
            helperText={
                <InputHelperText
                    touched={isTouched || isSubmitted}
                    error={error?.message}
                    helperText={helperText}
                />
            }
            {...sanitizeInputRestProps(rest)}
        />
    );
};

TextInput.propTypes = {
    className: PropTypes.string,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    options: PropTypes.object,
    resource: PropTypes.string,
    source: PropTypes.string,
};

TextInput.defaultProps = {
    options: {},
};

export type TextInputProps = CommonInputProps &
    Omit<ResettableTextFieldProps, 'label' | 'helperText'>;

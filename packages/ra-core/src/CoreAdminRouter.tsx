import React, {
    Children,
    Component,
    cloneElement,
    createElement,
    ComponentType,
    CSSProperties,
    ReactElement,
} from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import { AUTH_GET_PERMISSIONS } from './auth/types';
import { isLoggedIn } from './reducer';
import { userLogout as userLogoutAction } from './actions/authActions';
import RoutesWithLayout from './RoutesWithLayout';
import AuthContext from './auth/AuthContext';
import {
    Dispatch,
    AdminChildren,
    CustomRoutes,
    CatchAllComponent,
    LayoutComponent,
    LayoutProps,
    ResourceProps,
    RenderResourcesFunction,
    ResourceElement,
} from './types';

const welcomeStyles: CSSProperties = {
    width: '50%',
    margin: '40vh',
    textAlign: 'center',
};

export interface AdminRouterProps extends LayoutProps {
    layout: LayoutComponent;
    catchAll: CatchAllComponent;
    children?: AdminChildren;
    customRoutes?: CustomRoutes;
    loading: ComponentType;
}

interface EnhancedProps {
    isLoggedIn?: boolean;
    userLogout: Dispatch<typeof userLogoutAction>;
}

interface State {
    children: ResourceElement[];
}

export class CoreAdminRouter extends Component<
    AdminRouterProps & EnhancedProps,
    State
> {
    static defaultProps: Partial<AdminRouterProps> = {
        customRoutes: [],
    };
    static contextType = AuthContext;
    state: State = { children: [] };

    componentWillMount() {
        this.initializeResources(this.props);
    }

    initializeResources = (nextProps: AdminRouterProps & EnhancedProps) => {
        if (typeof nextProps.children === 'function') {
            this.initializeResourcesAsync(nextProps);
        }
    };

    initializeResourcesAsync = async (
        props: AdminRouterProps & EnhancedProps
    ) => {
        const authProvider = this.context;
        try {
            const permissions = await authProvider(AUTH_GET_PERMISSIONS);
            const resolveChildren = props.children as RenderResourcesFunction;

            const childrenFuncResult = resolveChildren(permissions);
            if ((childrenFuncResult as Promise<ResourceElement[]>).then) {
                (childrenFuncResult as Promise<ResourceElement[]>).then(
                    resolvedChildren => {
                        this.setState({
                            children: resolvedChildren
                                .filter(child => child)
                                .map(child => ({
                                    ...child,
                                    props: {
                                        ...child.props,
                                        key: child.props.name,
                                    },
                                })),
                        });
                    }
                );
            } else {
                this.setState({
                    children: (childrenFuncResult as ResourceElement[]).filter(
                        child => child
                    ),
                });
            }
        } catch (error) {
            this.props.userLogout();
        }
    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.isLoggedIn !== this.props.isLoggedIn) {
            this.setState(
                {
                    children: [],
                },
                () => this.initializeResources(nextProps)
            );
        }
    }

    renderCustomRoutesWithoutLayout = (route, props) => {
        if (route.props.render) {
            return route.props.render({
                ...props,
                title: this.props.title,
            });
        }
        if (route.props.component) {
            return createElement(route.props.component, {
                ...props,
                title: this.props.title,
            });
        }
    };

    render() {
        const {
            layout,
            catchAll,
            children,
            customRoutes,
            dashboard,
            loading,
            logout,
            menu,
            theme,
            title,
        } = this.props;

        if (
            process.env.NODE_ENV !== 'production' &&
            typeof children !== 'function' &&
            !children
        ) {
            return (
                <div style={welcomeStyles}>
                    React-admin is properly configured.
                    <br />
                    Now you can add a first &lt;Resource&gt; as child of
                    &lt;Admin&gt;.
                </div>
            );
        }

        if (
            typeof children === 'function' &&
            (!this.state.children || this.state.children.length === 0)
        ) {
            return <Route path="/" key="loading" component={loading} />;
        }

        const childrenToRender = (typeof children === 'function'
            ? this.state.children
            : children) as Array<ReactElement<any, any>>;

        return (
            <div>
                {// Render every resources children outside the React Router Switch
                // as we need all of them and not just the one rendered
                Children.map(
                    childrenToRender,
                    (child: React.ReactElement<ResourceProps>) =>
                        cloneElement(child, {
                            key: child.props.name,
                            // The context prop instructs the Resource component to not render anything
                            // but simply to register itself as a known resource
                            intent: 'registration',
                        })
                )}
                <Switch>
                    {customRoutes
                        .filter(route => route.props.noLayout)
                        .map((route, key) =>
                            cloneElement(route, {
                                key,
                                render: props =>
                                    this.renderCustomRoutesWithoutLayout(
                                        route,
                                        props
                                    ),
                            })
                        )}
                    <Route
                        path="/"
                        render={() =>
                            createElement(
                                layout,
                                {
                                    dashboard,
                                    logout,
                                    menu,
                                    theme,
                                    title,
                                },
                                <RoutesWithLayout
                                    catchAll={catchAll}
                                    customRoutes={customRoutes.filter(
                                        route => !route.props.noLayout
                                    )}
                                    dashboard={dashboard}
                                    title={title}
                                >
                                    {Children.map(
                                        childrenToRender,
                                        (
                                            child: React.ReactElement<
                                                ResourceProps
                                            >
                                        ) =>
                                            cloneElement(child, {
                                                key: child.props.name,
                                                intent: 'route',
                                            })
                                    )}
                                </RoutesWithLayout>
                            )
                        }
                    />
                </Switch>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    isLoggedIn: isLoggedIn(state),
});

export default connect(
    mapStateToProps,
    { userLogout: userLogoutAction }
)(CoreAdminRouter) as ComponentType<AdminRouterProps>;

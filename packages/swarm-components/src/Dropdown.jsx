import React, {
	createContext,
	Children,
	useContext,
	useState,
	useEffect,
	useRef,
} from 'react';
import Portal from '@reach/portal';
import Rect, { useRect } from '@reach/rect';
import WindowSize from '@reach/window-size';
import {
	node,
	func,
	object,
	string,
	number,
	oneOfType,
	any,
	arrayOf,
} from 'prop-types';
import * as ReachUtils from '@reach/utils';
import { ForwardedButton } from './Button';

// TODO: add the mousedown/drag/mouseup to select of native menus, will
// also help w/ remove the menu button tooltip hide-flash.

// TODO: add type-to-highlight like native menus

const MenuContext = createContext();

const openAtFirstItem = state => ({ isOpen: true, selectionIndex: 0 });

const closeState = state => ({
	isOpen: false,
	selectionIndex: -1,
	closingWithClick: false,
});

const genId = prefix =>
	`${prefix}-${Math.random()
		.toString(32)
		.substr(2, 8)}`;

// //////////////////////////////////////////////////////////////////////

const getInitialState = () => ({
	isOpen: false,
	buttonRect: {},
	selectionIndex: -1,
	closingWithClick: false,
	buttonId: genId('button'),
});

const checkIfStylesIncluded = () => ReachUtils.checkStyles('menu-button');

const Menu = ({ children }) => {
	const [state, setState] = useState(getInitialState());

	const context = {
		state,
		setState,
		refs: {
			button: null,
			menu: null,
			items: [],
		},
	};

	useEffect(() => {
		checkIfStylesIncluded();
	}, [state.isOpen]);

	return (
		<MenuContext.Provider value={context}>
			{typeof children === 'function'
				? children({ isOpen: context.state.isOpen })
				: children}
		</MenuContext.Provider>
	);
};

Menu.propTypes = {
	children: oneOfType([func, node]),
};

// //////////////////////////////////////////////////////////////////////
const MenuButton = React.forwardRef(
	({ onClick, onKeyDown, onMouseDown, ...props }, ref) => {
		const { state, setState } = useContext(MenuContext);
		const buttonRef = useRef(null);
		const buttonRect = useRect(buttonRef, state.isOpen);

		useEffect(() => {
			// need to check false specifically because isOpen is initially undefined then updates
			// to false causing dropdown buttons to be focused
			if (state.isOpen === false && KeyboardEvent) {
				buttonRef.current.focus();
			}
		}, [state.isOpen]);

		useEffect(() => {
			setState({ ...state, buttonRect });
		}, [state.isOpen, buttonRect]);

		return (
			<ForwardedButton
				id={state.buttonId}
				aria-haspopup="menu"
				aria-expanded={state.isOpen}
				data-reach-menu-button
				type="button"
				ref={buttonRef}
				onMouseDown={ReachUtils.wrapEvent(onMouseDown, () => {
					if (state.isOpen) {
						setState({ ...state, closingWithClick: true });
					}
				})}
				onClick={ReachUtils.wrapEvent(onClick, () => {
					if (state.isOpen) {
						setState({ ...state, ...closeState() });
					} else {
						setState({ ...state, ...openAtFirstItem() });
					}
				})}
				onKeyDown={ReachUtils.wrapEvent(onKeyDown, event => {
					if (event.key === 'ArrowDown') {
						event.preventDefault(); // prevent scroll
						setState({ ...state, ...openAtFirstItem() });
					} else if (event.key === 'ArrowUp') {
						event.preventDefault(); // prevent scroll
						setState({ ...state, ...openAtFirstItem() });
					}
				})}
				{...props}
			/>
		);
	}
);

MenuButton.propTypes = {
	onClick: func,
	onKeyDown: func,
	onMouseDown: func,
	children: node,
};

const MenuItem = React.forwardRef(
	(
		{
			onSelect,
			onClick,
			role = 'menuitem',
			index,
			onKeyDown,
			onMouseMove,
			onMouseLeave,
			setState: propSetState,
			state: propState,
			_ref,
			...rest
		},
		ref
	) => {
		const { state, setState } = useContext(MenuContext);
		const isSelected = state && index === state.selectionIndex;
		const select = () => {
			onSelect();
			setState({ ...state, ...closeState() });
		};

		const itemRef = useRef(null);

		useEffect(() => {
			if (itemRef.current && state.selectionIndex === index) {
				itemRef.current.focus();
			} else if (state.selectionIndex === -1) {
				itemRef.current.blur();
			}
		}, [state.selectionIndex]);

		return (
			<div
				{...rest}
				ref={itemRef}
				data-reach-menu-item={role === 'menuitem' ? true : undefined}
				role={role}
				tabIndex="-1"
				data-selected={role === 'menuitem' && isSelected ? true : undefined}
				onClick={ReachUtils.wrapEvent(onClick, event => {
					select();
				})}
				onKeyDown={ReachUtils.wrapEvent(onKeyDown, event => {
					if (event.key === 'Enter') {
						// prevent the button from being "clicked" by
						// this "Enter" keydown
						event.preventDefault();
						select();
					}
				})}
				onMouseMove={ReachUtils.wrapEvent(onMouseMove, event => {
					if (!isSelected) {
						setState({ ...state, selectionIndex: index });
					}
				})}
				onMouseLeave={ReachUtils.wrapEvent(onMouseLeave, event => {
					// clear out selection when mouse over a non-menu item child
					setState({ ...state, selectionIndex: -1 });
				})}
			/>
		);
	}
);

MenuItem.propTypes = {
	onSelect: func.isRequired,
	onClick: func,
	role: string,
	state: object,
	setState: func,
	index: number,
	onKeyDown: func,
	onMouseMove: func,
	onMouseLeave: func,
	_ref: func,
};

const k = () => {};

// //////////////////////////////////////////////////////////////////////
const MenuLink = React.forwardRef(
	(
		{
			onKeyDown,
			onClick,
			component: Comp,
			as: AsComp = 'a',
			style,
			setState: propSetState,
			state: propState,
			index,
			_ref,
			...props
		},
		ref
	) => {
		const Link = Comp || AsComp;
		const { state, setState } = useContext(MenuContext);

		const itemRef = useRef(null);

		useEffect(() => {
			if (itemRef.current && state.selectionIndex === index) {
				itemRef.current.focus();
			} else {
				itemRef.current.blur();
			}
		}, [state.selectionIndex]);

		if (Comp) {
			console.warn(
				'[@swarm-ui/dropdown]: Please use the `as` prop instead of `component`.'
			);
		}
		return (
			<MenuItem role="none" index={index} onSelect={k} _ref={k}>
				<Link
					role="menuitem"
					data-reach-menu-item
					tabIndex="-1"
					data-selected={index === state.selectionIndex ? true : undefined}
					onClick={ReachUtils.wrapEvent(onClick, event => {
						setState({ ...closeState() });
					})}
					onKeyDown={ReachUtils.wrapEvent(onKeyDown, event => {
						if (event.key === 'Enter') {
							// prevent MenuItem's preventDefault from firing,
							// allowing this link to work w/ the keyboard
							event.stopPropagation();
						}
					})}
					ref={itemRef}
					style={style}
					{...props}
				/>
			</MenuItem>
		);
	}
);

MenuLink.propTypes = {
	onKeyDown: func,
	onClick: func,
	component: any,
	as: any,
	style: object,
	setState: func,
	state: object,
	index: number,
	_ref: func,
};
// /////////////////////////////////////////////////////////////////

// The open state is client side only
const MenuList = React.forwardRef((props, ref) => {
	const { state } = useContext(MenuContext);

	return (
		state.isOpen && (
			<Portal>
				<WindowSize>
					{() => (
						<Rect>
							{({ rect: menuRect, ref: menuRef }) => (
								<div
									data-reach-menu
									ref={menuRef}
									style={getStyles(state.buttonRect, menuRect, props.style)}
								>
									<MenuListImpl {...props} ref={ref} />
								</div>
							)}
						</Rect>
					)}
				</WindowSize>
			</Portal>
		)
	);
});

MenuList.propTypes = {
	style: object,
	children: node,
};

const isFocusableChildType = (child, types = []) => types.includes(child.type);
const getFocusableMenuChildren = (children, types) => {
	const focusable = [];
	Children.forEach(children, child => {
		if (isFocusableChildType(child, types)) focusable.push(child);
	});
	return focusable;
};

const MenuListImpl = React.forwardRef(
	(
		{
			children,
			onKeyDown,
			onBlur,
			focusableChildrenTypes = [MenuItem, MenuLink],
			...rest
		},
		ref
	) => {
		const { state, setState, refs } = useContext(MenuContext);
		const focusableChildren = getFocusableMenuChildren(
			children,
			focusableChildrenTypes
		);

		const menuListRef = useRef(null);

		useEffect(() => {
			if (menuListRef && state.selectionIndex === -1) {
				menuListRef.current.focus();
			}
		}, [state.selectionIndex]);

		const handleClickOutside = e => {
			const buttonId = document.getElementById(state.buttonId);
			if (menuListRef.current.contains(e.target) || buttonId.contains(e.target)) {
				return;
			}
			setState({ ...state, closingWithClick: true, isOpen: false });
		};

		useEffect(() => {
			if (state.isOpen) {
				document.addEventListener('mousedown', handleClickOutside);
			} else {
				document.removeEventListener('mousedown', handleClickOutside);
			}

			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}, [state.isOpen]);

		return (
			<div
				data-reach-menu-list
				{...rest}
				role="menu"
				aria-labelledby={state.buttonId}
				tabIndex="-1"
				ref={menuListRef}
				onKeyDown={ReachUtils.wrapEvent(onKeyDown, event => {
					if (event.key === 'Escape') {
						setState({ ...state, ...closeState() });
					} else if (event.key === 'ArrowDown') {
						event.preventDefault(); // prevent window scroll
						const nextIndex = state.selectionIndex + 1;
						if (nextIndex !== focusableChildren.length) {
							setState({ ...state, selectionIndex: nextIndex });
						}
					} else if (event.key === 'ArrowUp') {
						event.preventDefault(); // prevent window scroll
						const nextIndex = state.selectionIndex - 1;
						if (nextIndex !== -1) {
							setState({ ...state, selectionIndex: nextIndex });
						}
					} else if (event.key === 'Tab') {
						event.preventDefault(); // prevent leaving
					}
				})}
			>
				{Children.map(children, (child, index) => {
					if (isFocusableChildType(child, focusableChildrenTypes)) {
						const focusIndex = focusableChildren.indexOf(child);

						return React.cloneElement(child, {
							setState,
							state,
							index: focusIndex,
							_ref: node => (refs.items[focusIndex] = node),
						});
					}

					return child;
				})}
			</div>
		);
	}
);

MenuListImpl.propTypes = {
	refs: object,
	state: object,
	setState: func,
	focusableChildrenTypes: arrayOf(any),
	children: node,
	onKeyDown: func,
	onBlur: func,
};

const getStyles = (buttonRect, menuRect, style = {}) => {
	const haventMeasuredButtonYet = !buttonRect;
	if (haventMeasuredButtonYet) {
		return { opacity: 0 };
	}

	const haventMeasuredMenuYet = !menuRect;

	const styles = {
		left: `${buttonRect.left + window.pageXOffset}px`,
		top: `${buttonRect.top + buttonRect.height + window.pageYOffset}px`,
		zIndex: style.zIndex || 'auto',
	};

	if (haventMeasuredMenuYet) {
		return {
			...styles,
			opacity: 0,
		};
	}

	if (buttonRect.width < 500) {
		styles.minWidth = buttonRect.width;
	}

	const collisions = {
		top: buttonRect.top - menuRect.height < 0,
		right: window.innerWidth < buttonRect.left + menuRect.width,
		bottom: window.innerHeight < buttonRect.top + menuRect.height,
		left: buttonRect.left - menuRect.width < 0,
	};

	const directionRight = collisions.right && !collisions.left;
	const directionUp = collisions.bottom && !collisions.top;

	return {
		...styles,
		left: directionRight
			? `${buttonRect.right - menuRect.width + window.pageXOffset}px`
			: `${buttonRect.left + window.pageXOffset}px`,
		top: directionUp
			? `${buttonRect.top - menuRect.height + window.pageYOffset}px`
			: `${buttonRect.top + buttonRect.height + window.pageYOffset}px`,
	};
};

export { Menu, MenuList, MenuButton, MenuLink, MenuItem };

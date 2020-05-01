
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function xlink_attr(node, attribute, value) {
        node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.21.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/ExternalLink.svelte generated by Svelte v3.21.0 */

    const file = "src/components/ExternalLink.svelte";

    function create_fragment(ctx) {
    	let a;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			img = element("img");
    			if (img.src !== (img_src_value = `/images/${/*icon*/ ctx[1]}.svg`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "width", "30px");
    			attr_dev(img, "height", "30px");
    			attr_dev(img, "color", "white");
    			add_location(img, file, 11, 4, 199);
    			attr_dev(a, "href", /*link*/ ctx[0]);
    			attr_dev(a, "target", /*target*/ ctx[2]);
    			attr_dev(a, "class", /*icon*/ ctx[1]);
    			add_location(a, file, 10, 0, 150);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*icon*/ 2 && img.src !== (img_src_value = `/images/${/*icon*/ ctx[1]}.svg`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*link*/ 1) {
    				attr_dev(a, "href", /*link*/ ctx[0]);
    			}

    			if (dirty & /*target*/ 4) {
    				attr_dev(a, "target", /*target*/ ctx[2]);
    			}

    			if (dirty & /*icon*/ 2) {
    				attr_dev(a, "class", /*icon*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { link } = $$props;
    	let { icon } = $$props;
    	let target = "";

    	if (!link.includes("mailto")) {
    		target = "_blank";
    	}

    	const writable_props = ["link", "icon"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ExternalLink> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ExternalLink", $$slots, []);

    	$$self.$set = $$props => {
    		if ("link" in $$props) $$invalidate(0, link = $$props.link);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    	};

    	$$self.$capture_state = () => ({ link, icon, target });

    	$$self.$inject_state = $$props => {
    		if ("link" in $$props) $$invalidate(0, link = $$props.link);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("target" in $$props) $$invalidate(2, target = $$props.target);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [link, icon, target];
    }

    class ExternalLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { link: 0, icon: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ExternalLink",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*link*/ ctx[0] === undefined && !("link" in props)) {
    			console.warn("<ExternalLink> was created without expected prop 'link'");
    		}

    		if (/*icon*/ ctx[1] === undefined && !("icon" in props)) {
    			console.warn("<ExternalLink> was created without expected prop 'icon'");
    		}
    	}

    	get link() {
    		throw new Error("<ExternalLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set link(value) {
    		throw new Error("<ExternalLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<ExternalLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<ExternalLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ContactInfo.svelte generated by Svelte v3.21.0 */
    const file$1 = "src/components/ContactInfo.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let h1;
    	let t1;
    	let ul;
    	let li0;
    	let t2;
    	let li1;
    	let t3;
    	let li2;
    	let current;
    	const externallink0_spread_levels = [/*gitLink*/ ctx[0]];
    	let externallink0_props = {};

    	for (let i = 0; i < externallink0_spread_levels.length; i += 1) {
    		externallink0_props = assign(externallink0_props, externallink0_spread_levels[i]);
    	}

    	const externallink0 = new ExternalLink({
    			props: externallink0_props,
    			$$inline: true
    		});

    	const externallink1_spread_levels = [/*linkedIn*/ ctx[1]];
    	let externallink1_props = {};

    	for (let i = 0; i < externallink1_spread_levels.length; i += 1) {
    		externallink1_props = assign(externallink1_props, externallink1_spread_levels[i]);
    	}

    	const externallink1 = new ExternalLink({
    			props: externallink1_props,
    			$$inline: true
    		});

    	const externallink2_spread_levels = [/*email*/ ctx[2]];
    	let externallink2_props = {};

    	for (let i = 0; i < externallink2_spread_levels.length; i += 1) {
    		externallink2_props = assign(externallink2_props, externallink2_spread_levels[i]);
    	}

    	const externallink2 = new ExternalLink({
    			props: externallink2_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			h1 = element("h1");
    			h1.textContent = "Joshua Hahn";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			create_component(externallink0.$$.fragment);
    			t2 = space();
    			li1 = element("li");
    			create_component(externallink1.$$.fragment);
    			t3 = space();
    			li2 = element("li");
    			create_component(externallink2.$$.fragment);
    			add_location(h1, file$1, 20, 4, 428);
    			attr_dev(li0, "class", "svelte-yfcgud");
    			add_location(li0, file$1, 22, 8, 466);
    			attr_dev(li1, "class", "svelte-yfcgud");
    			add_location(li1, file$1, 23, 8, 512);
    			attr_dev(li2, "class", "svelte-yfcgud");
    			add_location(li2, file$1, 24, 8, 559);
    			attr_dev(ul, "class", "svelte-yfcgud");
    			add_location(ul, file$1, 21, 4, 453);
    			attr_dev(section, "id", "contact-info");
    			attr_dev(section, "class", "svelte-yfcgud");
    			add_location(section, file$1, 19, 0, 396);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h1);
    			append_dev(section, t1);
    			append_dev(section, ul);
    			append_dev(ul, li0);
    			mount_component(externallink0, li0, null);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			mount_component(externallink1, li1, null);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			mount_component(externallink2, li2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const externallink0_changes = (dirty & /*gitLink*/ 1)
    			? get_spread_update(externallink0_spread_levels, [get_spread_object(/*gitLink*/ ctx[0])])
    			: {};

    			externallink0.$set(externallink0_changes);

    			const externallink1_changes = (dirty & /*linkedIn*/ 2)
    			? get_spread_update(externallink1_spread_levels, [get_spread_object(/*linkedIn*/ ctx[1])])
    			: {};

    			externallink1.$set(externallink1_changes);

    			const externallink2_changes = (dirty & /*email*/ 4)
    			? get_spread_update(externallink2_spread_levels, [get_spread_object(/*email*/ ctx[2])])
    			: {};

    			externallink2.$set(externallink2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(externallink0.$$.fragment, local);
    			transition_in(externallink1.$$.fragment, local);
    			transition_in(externallink2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(externallink0.$$.fragment, local);
    			transition_out(externallink1.$$.fragment, local);
    			transition_out(externallink2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(externallink0);
    			destroy_component(externallink1);
    			destroy_component(externallink2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const gitLink = {
    		link: "https://github.com/tailrin",
    		icon: "github"
    	};

    	const linkedIn = {
    		link: "https://www.linkedin.com/in/joshua-calab-hahn",
    		icon: "linkedin"
    	};

    	const email = {
    		link: "mailto:joshua@hahnwebdevelopment.com",
    		icon: "envelope"
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ContactInfo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ContactInfo", $$slots, []);
    	$$self.$capture_state = () => ({ ExternalLink, gitLink, linkedIn, email });
    	return [gitLink, linkedIn, email];
    }

    class ContactInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContactInfo",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/Header.svelte generated by Svelte v3.21.0 */
    const file$2 = "src/components/Header.svelte";

    function create_fragment$2(ctx) {
    	let header;
    	let img;
    	let img_src_value;
    	let t;
    	let current;
    	const contactinfo = new ContactInfo({ $$inline: true });

    	const block = {
    		c: function create() {
    			header = element("header");
    			img = element("img");
    			t = space();
    			create_component(contactinfo.$$.fragment);
    			if (img.src !== (img_src_value = "images/Joshua.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "picture of Joshua");
    			attr_dev(img, "id", "hero-image");
    			attr_dev(img, "class", "svelte-1n6gote");
    			add_location(img, file$2, 5, 4, 85);
    			attr_dev(header, "class", "svelte-1n6gote");
    			add_location(header, file$2, 4, 0, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, img);
    			append_dev(header, t);
    			mount_component(contactinfo, header, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contactinfo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contactinfo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(contactinfo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	$$self.$capture_state = () => ({ ContactInfo });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var store = /*#__PURE__*/Object.freeze({
        __proto__: null,
        derived: derived,
        readable: readable,
        writable: writable,
        get: get_store_value
    });

    const curRoute = writable({});
    const routeParams = writable({});

    /* src/components/NavBarLink.svelte generated by Svelte v3.21.0 */
    const file$3 = "src/components/NavBarLink.svelte";

    // (23:0) {:else}
    function create_else_block(ctx) {
    	let a;
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(/*name*/ ctx[1]);
    			attr_dev(a, "href", /*route*/ ctx[0]);
    			attr_dev(a, "id", /*name*/ ctx[1]);
    			attr_dev(a, "class", "svelte-16r53a9");
    			add_location(a, file$3, 23, 4, 568);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 2) set_data_dev(t, /*name*/ ctx[1]);

    			if (dirty & /*route*/ 1) {
    				attr_dev(a, "href", /*route*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 2) {
    				attr_dev(a, "id", /*name*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(23:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if isSelected}
    function create_if_block(ctx) {
    	let a;
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(/*name*/ ctx[1]);
    			attr_dev(a, "href", /*route*/ ctx[0]);
    			attr_dev(a, "class", "selected svelte-16r53a9");
    			attr_dev(a, "id", /*name*/ ctx[1]);
    			add_location(a, file$3, 21, 4, 501);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 2) set_data_dev(t, /*name*/ ctx[1]);

    			if (dirty & /*route*/ 1) {
    				attr_dev(a, "href", /*route*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 2) {
    				attr_dev(a, "id", /*name*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(21:0) {#if isSelected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*isSelected*/ ctx[2]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { route = "/" } = $$props;
    	let { name = "Home" } = $$props;
    	let isSelected = false;
    	let curRouteVal;

    	const unsubscribe = curRoute.subscribe(value => {
    		$$invalidate(3, curRouteVal = value.name);
    	});

    	onDestroy(unsubscribe);
    	const writable_props = ["route", "name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NavBarLink> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("NavBarLink", $$slots, []);

    	$$self.$set = $$props => {
    		if ("route" in $$props) $$invalidate(0, route = $$props.route);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		curRoute,
    		routeParams,
    		route,
    		name,
    		isSelected,
    		curRouteVal,
    		unsubscribe
    	});

    	$$self.$inject_state = $$props => {
    		if ("route" in $$props) $$invalidate(0, route = $$props.route);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("isSelected" in $$props) $$invalidate(2, isSelected = $$props.isSelected);
    		if ("curRouteVal" in $$props) $$invalidate(3, curRouteVal = $$props.curRouteVal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*curRouteVal, route*/ 9) {
    			 {
    				if (curRouteVal === route) {
    					$$invalidate(2, isSelected = true);
    				} else {
    					$$invalidate(2, isSelected = false);
    				}
    			}
    		}
    	};

    	return [route, name, isSelected];
    }

    class NavBarLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { route: 0, name: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBarLink",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get route() {
    		throw new Error("<NavBarLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set route(value) {
    		throw new Error("<NavBarLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<NavBarLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<NavBarLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/NavBar.svelte generated by Svelte v3.21.0 */
    const file$4 = "src/components/NavBar.svelte";

    function create_fragment$4(ctx) {
    	let nav;
    	let t0;
    	let t1;
    	let current;

    	const navbarlink0 = new NavBarLink({
    			props: { name: "Home", route: "/" },
    			$$inline: true
    		});

    	const navbarlink1 = new NavBarLink({
    			props: { name: "About Me", route: "/about" },
    			$$inline: true
    		});

    	const navbarlink2 = new NavBarLink({
    			props: { name: "Projects", route: "/projects" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			create_component(navbarlink0.$$.fragment);
    			t0 = space();
    			create_component(navbarlink1.$$.fragment);
    			t1 = space();
    			create_component(navbarlink2.$$.fragment);
    			attr_dev(nav, "class", "svelte-1s34wqn");
    			add_location(nav, file$4, 5, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			mount_component(navbarlink0, nav, null);
    			append_dev(nav, t0);
    			mount_component(navbarlink1, nav, null);
    			append_dev(nav, t1);
    			mount_component(navbarlink2, nav, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbarlink0.$$.fragment, local);
    			transition_in(navbarlink1.$$.fragment, local);
    			transition_in(navbarlink2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbarlink0.$$.fragment, local);
    			transition_out(navbarlink1.$$.fragment, local);
    			transition_out(navbarlink2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(navbarlink0);
    			destroy_component(navbarlink1);
    			destroy_component(navbarlink2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("NavBar", $$slots, []);
    	$$self.$capture_state = () => ({ NavBarLink, curRoute, routeParams });
    	return [];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    var require$$0 = getCjsExportFromNamespace(store);

    const writable$1 = require$$0.writable;

    const router = writable$1({});

    function set(route) {
      router.set(route);
    }

    function remove() {
      router.set({});
    }

    const activeRoute = {
      subscribe: router.subscribe,
      set,
      remove
    };

    var store$1 = { activeRoute };
    var store_1 = store$1.activeRoute;

    const UrlParser = (urlString, namedUrl = "") => {
      const urlBase = new URL(urlString);

      /**
       * Wrapper for URL.host
       *
       **/
      function host() {
        return urlBase.host;
      }

      /**
       * Wrapper for URL.hostname
       *
       **/
      function hostname() {
        return urlBase.hostname;
      }

      /**
       * Returns an object with all the named params and their values
       *
       **/
      function namedParams() {
        const allPathName = pathNames();
        const allNamedParamsKeys = namedParamsWithIndex();

        return allNamedParamsKeys.reduce((values, paramKey) => {
          values[paramKey.value] = allPathName[paramKey.index];
          return values;
        }, {});
      }

      /**
       * Returns an array with all the named param keys
       *
       **/
      function namedParamsKeys() {
        const allNamedParamsKeys = namedParamsWithIndex();

        return allNamedParamsKeys.reduce((values, paramKey) => {
          values.push(paramKey.value);
          return values;
        }, []);
      }

      /**
       * Returns an array with all the named param values
       *
       **/
      function namedParamsValues() {
        const allPathName = pathNames();
        const allNamedParamsKeys = namedParamsWithIndex();

        return allNamedParamsKeys.reduce((values, paramKey) => {
          values.push(allPathName[paramKey.index]);
          return values;
        }, []);
      }

      /**
       * Returns an array with all named param ids and their position in the path
       * Private
       **/
      function namedParamsWithIndex() {
        const namedUrlParams = getPathNames(namedUrl);

        return namedUrlParams.reduce((validParams, param, index) => {
          if (param[0] === ":") {
            validParams.push({ value: param.slice(1), index });
          }
          return validParams;
        }, []);
      }

      /**
       * Wrapper for URL.port
       *
       **/
      function port() {
        return urlBase.port;
      }

      /**
       * Wrapper for URL.pathname
       *
       **/
      function pathname() {
        return urlBase.pathname;
      }

      /**
       * Wrapper for URL.protocol
       *
       **/
      function protocol() {
        return urlBase.protocol;
      }

      /**
       * Wrapper for URL.search
       *
       **/
      function search() {
        return urlBase.search;
      }

      /**
       * Returns an object with all query params and their values
       *
       **/
      function queryParams() {
        const params = {};
        urlBase.searchParams.forEach((value, key) => {
          params[key] = value;
        });

        return params;
      }

      /**
       * Returns an array with all the query param keys
       *
       **/
      function queryParamsKeys() {
        const params = [];
        urlBase.searchParams.forEach((_value, key) => {
          params.push(key);
        });

        return params;
      }

      /**
       * Returns an array with all the query param values
       *
       **/
      function queryParamsValues() {
        const params = [];
        urlBase.searchParams.forEach(value => {
          params.push(value);
        });

        return params;
      }

      /**
       * Returns an array with all the elements of a pathname
       *
       **/
      function pathNames() {
        return getPathNames(urlBase.pathname);
      }

      /**
       * Returns an array with all the parts of a pathname
       * Private method
       **/
      function getPathNames(pathName) {
        if (pathName === "/" || pathName.trim().length === 0) return [pathName];
        if (pathName.slice(-1) === "/") {
          pathName = pathName.slice(0, -1);
        }
        if (pathName[0] === "/") {
          pathName = pathName.slice(1);
        }

        return pathName.split("/");
      }

      return Object.freeze({
        host: host(),
        hostname: hostname(),
        namedParams: namedParams(),
        namedParamsKeys: namedParamsKeys(),
        namedParamsValues: namedParamsValues(),
        pathNames: pathNames(),
        port: port(),
        pathname: pathname(),
        protocol: protocol(),
        search: search(),
        queryParams: queryParams(),
        queryParamsKeys: queryParamsKeys(),
        queryParamsValues: queryParamsValues()
      });
    };

    var url_parser = { UrlParser };

    const UrlParser$1 = url_parser.UrlParser;

    var urlParamsParser = {
      UrlParser: UrlParser$1
    };

    /**
     * Returns true if object has any nested routes empty
     * @param routeObject
     **/
    function anyEmptyNestedRoutes(routeObject) {
      let result = false;
      if (Object.keys(routeObject).length === 0) {
        return true
      }

      if (routeObject.childRoute && Object.keys(routeObject.childRoute).length === 0) {
        result = true;
      } else if (routeObject.childRoute) {
        result = anyEmptyNestedRoutes(routeObject.childRoute);
      }

      return result
    }

    /**
     * Compare two routes ignoring named params
     * @param pathName string
     * @param routeName string
     **/

    function compareRoutes(pathName, routeName) {
      routeName = removeSlash(routeName);

      if (routeName.includes(':')) {
        return routeName.includes(pathName)
      } else {
        return routeName.startsWith(pathName)
      }
    }

    /**
     * Returns a boolean indicating if the name of path exists in the route based on the language parameter
     * @param pathName string
     * @param route object
     * @param language string
     **/

    function findLocalisedRoute(pathName, route, language) {
      let exists = false;

      if (language) {
        return { exists: route.lang && route.lang[language] && route.lang[language].includes(pathName), language }
      }

      exists = compareRoutes(pathName, route.name);

      if (!exists && route.lang && typeof route.lang === 'object') {
        for (const [key, value] of Object.entries(route.lang)) {
          if (compareRoutes(pathName, value)) {
            exists = true;
            language = key;
          }
        }
      }

      return { exists, language }
    }

    /**
     * Return all the consecutive named param (placeholders) of a pathname
     * @param pathname
     **/
    function getNamedParams(pathName = '') {
      if (pathName.trim().length === 0) return []
      const namedUrlParams = getPathNames(pathName);
      return namedUrlParams.reduce((validParams, param) => {
        if (param[0] === ':') {
          validParams.push(param.slice(1));
        }

        return validParams
      }, [])
    }

    /**
     * Split a pathname based on /
     * @param pathName
     * Private method
     **/
    function getPathNames(pathName) {
      if (pathName === '/' || pathName.trim().length === 0) return [pathName]

      pathName = removeSlash(pathName, 'both');

      return pathName.split('/')
    }

    /**
     * Return the first part of a pathname until the first named param is found
     * @param name
     **/
    function nameToPath(name = '') {
      let routeName;
      if (name === '/' || name.trim().length === 0) return name
      name = removeSlash(name, 'lead');
      routeName = name.split(':')[0];
      routeName = removeSlash(routeName, 'trail');

      return routeName.toLowerCase()
    }

    /**
     * Return the path name excluding query params
     * @param name
     **/
    function pathWithoutQueryParams(currentRoute) {
      const path = currentRoute.path.split('?');
      return path[0]
    }

    /**
     * Return the path name including query params
     * @param name
     **/
    function pathWithQueryParams(currentRoute) {
      let queryParams = [];
      if (currentRoute.queryParams) {
        for (let [key, value] of Object.entries(currentRoute.queryParams)) {
          queryParams.push(`${key}=${value}`);
        }
      }

      if (queryParams.length > 0) {
        return `${currentRoute.path}?${queryParams.join('&')}`
      } else {
        return currentRoute.path
      }
    }

    /**
     * Returns a string with trailing or leading slash character removed
     * @param pathName string
     * @param position string - lead, trail, both
     **/
    function removeExtraPaths(pathNames, basePathNames) {
      const names = basePathNames.split('/');
      if (names.length > 1) {
        names.forEach(function(name, index) {
          if (name.length > 0 && index > 0) {
            pathNames.shift();
          }
        });
      }

      return pathNames
    }

    /**
     * Returns a string with trailing or leading slash character removed
     * @param pathName string
     * @param position string - lead, trail, both
     **/

    function removeSlash(pathName, position = 'lead') {
      if (pathName.trim().length < 1) {
        return ''
      }

      if (position === 'trail' || position === 'both') {
        if (pathName.slice(-1) === '/') {
          pathName = pathName.slice(0, -1);
        }
      }

      if (position === 'lead' || position === 'both') {
        if (pathName[0] === '/') {
          pathName = pathName.slice(1);
        }
      }

      return pathName
    }

    /**
     * Returns the name of the route based on the language parameter
     * @param route object
     * @param language string
     **/

    function routeNameLocalised(route, language = null) {
      if (!language || !route.lang || !route.lang[language]) {
        return route.name
      } else {
        return route.lang[language]
      }
    }

    /**
     * Updates the base route path.
     * Route objects can have nested routes (childRoutes) or just a long name like "admin/employees/show/:id"
     *
     * @param basePath string
     * @param pathNames array
     * @param route object
     * @param language string
     **/

    function updateRoutePath(basePath, pathNames, route, language, convert = false) {
      if (basePath === '/' || basePath.trim().length === 0) return { result: basePath, language: null }

      let basePathResult = basePath;
      let routeName = route.name;
      let currentLanguage = language;

      if (convert) {
        currentLanguage = '';
      }

      routeName = removeSlash(routeName);
      basePathResult = removeSlash(basePathResult);

      if (!route.childRoute) {
        let localisedRoute = findLocalisedRoute(basePathResult, route, currentLanguage);

        if (localisedRoute.exists && convert) {
          basePathResult = routeNameLocalised(route, language);
        }

        let routeNames = routeName.split(':')[0];
        routeNames = removeSlash(routeNames, 'trail');
        routeNames = routeNames.split('/');
        routeNames.shift();
        routeNames.forEach(() => {
          const currentPathName = pathNames[0];
          localisedRoute = findLocalisedRoute(`${basePathResult}/${currentPathName}`, route, currentLanguage);

          if (currentPathName && localisedRoute.exists) {
            if (convert) {
              basePathResult = routeNameLocalised(route, language);
            } else {
              basePathResult = `${basePathResult}/${currentPathName}`;
            }
            pathNames.shift();
          } else {
            return { result: basePathResult, language: localisedRoute.language }
          }
        });
        return { result: basePathResult, language: localisedRoute.language }
      } else {
        return { result: basePath, language: currentLanguage }
      }
    }

    var utils = {
      anyEmptyNestedRoutes,
      compareRoutes,
      findLocalisedRoute,
      getNamedParams,
      getPathNames,
      nameToPath,
      pathWithQueryParams,
      pathWithoutQueryParams,
      removeExtraPaths,
      removeSlash,
      routeNameLocalised,
      updateRoutePath
    };

    const { UrlParser: UrlParser$2 } = urlParamsParser;

    const { pathWithQueryParams: pathWithQueryParams$1, removeSlash: removeSlash$1 } = utils;

    function RouterCurrent(trackPage) {
      const trackPageview = trackPage || false;
      let activeRoute = '';

      function setActive(newRoute) {
        activeRoute = newRoute.path;
        pushActiveRoute(newRoute);
      }

      function active() {
        return activeRoute
      }

      /**
       * Returns true if pathName is current active route
       * @param pathName String The path name to check against the current route.
       * @param includePath Boolean if true checks that pathName is included in current route. If false should match it.
       **/
      function isActive(queryPath, includePath = false) {
        if (queryPath[0] !== '/') {
          queryPath = '/' + queryPath;
        }

        // remove query params for comparison
        let pathName = UrlParser$2(`http://fake.com${queryPath}`).pathname;
        let activeRoutePath = UrlParser$2(`http://fake.com${activeRoute}`).pathname;

        pathName = removeSlash$1(pathName, 'trail');

        activeRoutePath = removeSlash$1(activeRoutePath, 'trail');

        if (includePath) {
          return activeRoutePath.includes(pathName)
        } else {
          return activeRoutePath === pathName
        }
      }

      function pushActiveRoute(newRoute) {
        if (typeof window !== 'undefined') {
          const pathAndSearch = pathWithQueryParams$1(newRoute);
          //if (window.history && window.history.state && window.history.state.page !== pathAndSearch) {
          window.history.pushState({ page: pathAndSearch }, '', pathAndSearch);
          if (trackPageview) {
            gaTracking(pathAndSearch);
          }
        }
      }

      function gaTracking(newPage) {
        if (typeof ga !== 'undefined') {
          ga('set', 'page', newPage);
          ga('send', 'pageview');
        }
      }

      return Object.freeze({ active, isActive, setActive })
    }

    var current = { RouterCurrent };

    function RouterGuard(onlyIf) {
      const guardInfo = onlyIf;

      function valid() {
        return guardInfo && guardInfo.guard && typeof guardInfo.guard === 'function'
      }

      function redirect() {
        return !guardInfo.guard()
      }

      function redirectPath() {
        let destinationUrl = '/';
        if (guardInfo.redirect && guardInfo.redirect.length > 0) {
          destinationUrl = guardInfo.redirect;
        }

        return destinationUrl
      }

      return Object.freeze({ valid, redirect, redirectPath })
    }

    var guard = { RouterGuard };

    const { RouterGuard: RouterGuard$1 } = guard;

    function RouterRedirect(route, currentPath) {
      const guard = RouterGuard$1(route.onlyIf);

      function path() {
        let redirectTo = currentPath;
        if (route.redirectTo && route.redirectTo.length > 0) {
          redirectTo = route.redirectTo;
        }

        if (guard.valid() && guard.redirect()) {
          redirectTo = guard.redirectPath();
        }

        return redirectTo
      }

      return Object.freeze({ path })
    }

    var redirect = { RouterRedirect };

    const { UrlParser: UrlParser$3 } = urlParamsParser;

    function RouterRoute({ routeInfo, path, routeNamedParams, urlParser, namedPath, language }) {
      function namedParams() {
        const parsedParams = UrlParser$3(`https://fake.com${urlParser.pathname}`, namedPath).namedParams;

        return { ...routeNamedParams, ...parsedParams }
      }

      function get() {
        return {
          name: path,
          component: routeInfo.component,
          layout: routeInfo.layout,
          queryParams: urlParser.queryParams,
          namedParams: namedParams(),
          path,
          language
        }
      }

      return Object.freeze({ get, namedParams })
    }

    var route = { RouterRoute };

    const { updateRoutePath: updateRoutePath$1, getNamedParams: getNamedParams$1, nameToPath: nameToPath$1, removeExtraPaths: removeExtraPaths$1, routeNameLocalised: routeNameLocalised$1 } = utils;

    function RouterPath({ basePath, basePathName, pathNames, convert, currentLanguage }) {
      let updatedPathRoute;
      let route;
      let routePathLanguage = currentLanguage;

      function updatedPath(currentRoute) {
        route = currentRoute;
        updatedPathRoute = updateRoutePath$1(basePathName, pathNames, route, routePathLanguage, convert);
        routePathLanguage = convert ? currentLanguage : updatedPathRoute.language;

        return updatedPathRoute
      }

      function localisedPathName() {
        return routeNameLocalised$1(route, routePathLanguage)
      }

      function localisedRouteWithoutNamedParams() {
        return nameToPath$1(localisedPathName())
      }

      function basePathNameWithoutNamedParams() {
        return nameToPath$1(updatedPathRoute.result)
      }

      function namedPath() {
        const localisedPath = localisedPathName();

        return basePath ? `${basePath}/${localisedPath}` : localisedPath
      }

      function routePath() {
        let routePathValue = `${basePath}/${basePathNameWithoutNamedParams()}`;
        if (routePathValue === '//') {
          routePathValue = '/';
        }

        if (routePathLanguage) {
          pathNames = removeExtraPaths$1(pathNames, localisedRouteWithoutNamedParams());
        }

        const namedParams = getNamedParams$1(localisedPathName());
        if (namedParams && namedParams.length > 0) {
          namedParams.forEach(function() {
            if (pathNames.length > 0) {
              routePathValue += `/${pathNames.shift()}`;
            }
          });
        }

        return routePathValue
      }

      function routeLanguage() {
        return routePathLanguage
      }

      function basePathSameAsLocalised() {
        return basePathNameWithoutNamedParams() === localisedRouteWithoutNamedParams()
      }

      return Object.freeze({
        basePathSameAsLocalised,
        updatedPath,
        basePathNameWithoutNamedParams,
        localisedPathName,
        localisedRouteWithoutNamedParams,
        namedPath,
        pathNames,
        routeLanguage,
        routePath
      })
    }

    var path = { RouterPath };

    const { UrlParser: UrlParser$4 } = urlParamsParser;

    const { RouterRedirect: RouterRedirect$1 } = redirect;
    const { RouterRoute: RouterRoute$1 } = route;
    const { RouterPath: RouterPath$1 } = path;
    const { anyEmptyNestedRoutes: anyEmptyNestedRoutes$1, pathWithoutQueryParams: pathWithoutQueryParams$1 } = utils;

    const NotFoundPage = '/404.html';

    function RouterFinder({ routes, currentUrl, routerOptions, convert }) {
      const defaultLanguage = routerOptions.defaultLanguage;
      const urlParser = UrlParser$4(currentUrl);
      let redirectTo = '';
      let routeNamedParams = {};

      function findActiveRoute() {
        let searchActiveRoute = searchActiveRoutes(routes, '', urlParser.pathNames, routerOptions.lang, convert);

        if (!searchActiveRoute || !Object.keys(searchActiveRoute).length || anyEmptyNestedRoutes$1(searchActiveRoute)) {
          if (typeof window !== 'undefined') {
            searchActiveRoute = { name: '404', component: '', path: '404', redirectTo: NotFoundPage };
          }
        } else {
          searchActiveRoute.path = pathWithoutQueryParams$1(searchActiveRoute);
        }

        return searchActiveRoute
      }

      /**
       * Gets an array of routes and the browser pathname and return the active route
       * @param routes
       * @param basePath
       * @param pathNames
       **/
      function searchActiveRoutes(routes, basePath, pathNames, currentLanguage, convert) {
        let currentRoute = {};
        let basePathName = pathNames.shift().toLowerCase();
        const routerPath = RouterPath$1({ basePath, basePathName, pathNames, convert, currentLanguage });

        routes.forEach(function(route) {
          routerPath.updatedPath(route);
          if (routerPath.basePathSameAsLocalised()) {
            let routePath = routerPath.routePath();

            redirectTo = RouterRedirect$1(route, redirectTo).path();

            if (currentRoute.name !== routePath) {
              currentRoute = setCurrentRoute({
                route,
                routePath,
                routeLanguage: routerPath.routeLanguage(),
                urlParser,
                namedPath: routerPath.namedPath()
              });
            }

            if (route.nestedRoutes && route.nestedRoutes.length > 0 && routerPath.pathNames.length > 0) {
              currentRoute.childRoute = searchActiveRoutes(
                route.nestedRoutes,
                routePath,
                routerPath.pathNames,
                routerPath.routeLanguage(),
                convert
              );
              currentRoute.path = currentRoute.childRoute.path;
              currentRoute.language = currentRoute.childRoute.language;
            } else if (nestedRoutesAndNoPath(route, routerPath.pathNames)) {
              const indexRoute = searchActiveRoutes(
                route.nestedRoutes,
                routePath,
                ['index'],
                routerPath.routeLanguage(),
                convert
              );
              if (indexRoute && Object.keys(indexRoute).length > 0) {
                currentRoute.childRoute = indexRoute;
                currentRoute.language = currentRoute.childRoute.language;
              }
            }
          }
        });

        if (redirectTo) {
          currentRoute.redirectTo = redirectTo;
        }

        return currentRoute
      }

      function nestedRoutesAndNoPath(route, pathNames) {
        return route.nestedRoutes && route.nestedRoutes.length > 0 && pathNames.length === 0
      }

      function setCurrentRoute({ route, routePath, routeLanguage, urlParser, namedPath }) {
        const routerRoute = RouterRoute$1({
          routeInfo: route,
          urlParser,
          path: routePath,
          routeNamedParams,
          namedPath,
          language: routeLanguage || defaultLanguage
        });
        routeNamedParams = routerRoute.namedParams();

        return routerRoute.get()
      }

      return Object.freeze({ findActiveRoute })
    }

    var finder = { RouterFinder };

    const { activeRoute: activeRoute$1 } = store$1;
    const { RouterCurrent: RouterCurrent$1 } = current;
    const { RouterFinder: RouterFinder$1 } = finder;
    const { removeSlash: removeSlash$2 } = utils;

    const NotFoundPage$1 = '/404.html';

    let userDefinedRoutes = [];
    let routerOptions = {};
    let routerCurrent;

    /**
     * Object exposes one single property: activeRoute
     * @param routes  Array of routes
     * @param currentUrl current url
     * @param options configuration options
     **/
    function SpaRouter(routes, currentUrl, options = {}) {
      routerOptions = { ...options };
      if (typeof currentUrl === 'undefined' || currentUrl === '') {
        currentUrl = document.location.href;
      }

      routerCurrent = RouterCurrent$1(routerOptions.gaPageviews);

      currentUrl = removeSlash$2(currentUrl, 'trail');
      userDefinedRoutes = routes;

      function findActiveRoute() {
        let convert = false;

        if (routerOptions.langConvertTo) {
          routerOptions.lang = routerOptions.langConvertTo;
          convert = true;
        }

        return RouterFinder$1({ routes, currentUrl, routerOptions, convert }).findActiveRoute()
      }

      /**
       * Redirect current route to another
       * @param destinationUrl
       **/
      function navigateNow(destinationUrl) {
        if (typeof window !== 'undefined') {
          if (destinationUrl === NotFoundPage$1) {
            routerCurrent.setActive({ path: NotFoundPage$1 });
          } else {
            navigateTo(destinationUrl);
          }
        }

        return destinationUrl
      }

      function setActiveRoute() {
        const currentRoute = findActiveRoute();
        if (currentRoute.redirectTo) {
          return navigateNow(currentRoute.redirectTo)
        }

        routerCurrent.setActive(currentRoute);
        activeRoute$1.set(currentRoute);

        return currentRoute
      }

      return Object.freeze({
        setActiveRoute,
        findActiveRoute
      })
    }

    /**
     * Converts a route to its localised version
     * @param pathName
     **/
    function localisedRoute(pathName, language) {
      pathName = removeSlash$2(pathName, 'lead');
      routerOptions.langConvertTo = language;

      return SpaRouter(userDefinedRoutes, 'http://fake.com/' + pathName, routerOptions).findActiveRoute()
    }

    /**
     * Updates the current active route and updates the browser pathname
     * @param pathName String
     * @param language String
     **/
    function navigateTo(pathName, language = null) {
      pathName = removeSlash$2(pathName, 'lead');

      if (language) {
        routerOptions.langConvertTo = language;
      }

      return SpaRouter(userDefinedRoutes, 'http://fake.com/' + pathName, routerOptions).setActiveRoute()
    }

    /**
     * Returns true if pathName is current active route
     * @param pathName String The path name to check against the current route.
     * @param includePath Boolean if true checks that pathName is included in current route. If false should match it.
     **/
    function routeIsActive(queryPath, includePath = false) {
      return routerCurrent.isActive(queryPath, includePath)
    }

    if (typeof window !== 'undefined') {
      // Avoid full page reload on local routes
      window.addEventListener('click', event => {
        if (event.target.pathname && event.target.hostname === window.location.hostname && event.target.localName === 'a') {
          event.preventDefault();
          // event.stopPropagation()
          navigateTo(event.target.pathname + event.target.search);
        }
      });

      window.onpopstate = function(_event) {
        navigateTo(window.location.pathname + window.location.search);
      };
    }

    var spa_router = { SpaRouter, localisedRoute, navigateTo, routeIsActive };
    var spa_router_1 = spa_router.SpaRouter;
    var spa_router_2 = spa_router.localisedRoute;
    var spa_router_3 = spa_router.navigateTo;
    var spa_router_4 = spa_router.routeIsActive;

    /* node_modules/svelte-router-spa/src/components/route.svelte generated by Svelte v3.21.0 */

    // (10:34) 
    function create_if_block_2(ctx) {
    	let current;

    	const route = new Route({
    			props: {
    				currentRoute: /*currentRoute*/ ctx[0].childRoute,
    				params: /*params*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_changes = {};
    			if (dirty & /*currentRoute*/ 1) route_changes.currentRoute = /*currentRoute*/ ctx[0].childRoute;
    			if (dirty & /*params*/ 2) route_changes.params = /*params*/ ctx[1];
    			route.$set(route_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(10:34) ",
    		ctx
    	});

    	return block;
    }

    // (8:33) 
    function create_if_block_1(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*currentRoute*/ ctx[0].component;

    	function switch_props(ctx) {
    		return {
    			props: {
    				currentRoute: {
    					.../*currentRoute*/ ctx[0],
    					component: ""
    				},
    				params: /*params*/ ctx[1]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};

    			if (dirty & /*currentRoute*/ 1) switch_instance_changes.currentRoute = {
    				.../*currentRoute*/ ctx[0],
    				component: ""
    			};

    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*currentRoute*/ ctx[0].component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(8:33) ",
    		ctx
    	});

    	return block;
    }

    // (6:0) {#if currentRoute.layout}
    function create_if_block$1(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*currentRoute*/ ctx[0].layout;

    	function switch_props(ctx) {
    		return {
    			props: {
    				currentRoute: { .../*currentRoute*/ ctx[0], layout: "" },
    				params: /*params*/ ctx[1]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*currentRoute*/ 1) switch_instance_changes.currentRoute = { .../*currentRoute*/ ctx[0], layout: "" };
    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*currentRoute*/ ctx[0].layout)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(6:0) {#if currentRoute.layout}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentRoute*/ ctx[0].layout) return 0;
    		if (/*currentRoute*/ ctx[0].component) return 1;
    		if (/*currentRoute*/ ctx[0].childRoute) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { currentRoute = {} } = $$props;
    	let { params = {} } = $$props;
    	const writable_props = ["currentRoute", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Route> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Route", $$slots, []);

    	$$self.$set = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({ currentRoute, params });

    	$$self.$inject_state = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentRoute, params];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { currentRoute: 0, params: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get currentRoute() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRoute(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var route$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Route
    });

    /* node_modules/svelte-router-spa/src/components/router.svelte generated by Svelte v3.21.0 */

    function create_fragment$6(ctx) {
    	let current;

    	const route = new Route({
    			props: { currentRoute: /*$activeRoute*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const route_changes = {};
    			if (dirty & /*$activeRoute*/ 1) route_changes.currentRoute = /*$activeRoute*/ ctx[0];
    			route.$set(route_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	validate_store(store_1, "activeRoute");
    	component_subscribe($$self, store_1, $$value => $$invalidate(0, $activeRoute = $$value));
    	let { routes = [] } = $$props;
    	let { options = {} } = $$props;

    	onMount(function () {
    		spa_router_1(routes, document.location.href, options).setActiveRoute();
    	});

    	const writable_props = ["routes", "options"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(1, routes = $$props.routes);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		SpaRouter: spa_router_1,
    		Route,
    		activeRoute: store_1,
    		routes,
    		options,
    		$activeRoute
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(1, routes = $$props.routes);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$activeRoute, routes, options];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { routes: 1, options: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get routes() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var router$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Router
    });

    /* node_modules/svelte-router-spa/src/components/navigate.svelte generated by Svelte v3.21.0 */
    const file$5 = "node_modules/svelte-router-spa/src/components/navigate.svelte";

    function create_fragment$7(ctx) {
    	let a;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			attr_dev(a, "href", /*to*/ ctx[0]);
    			attr_dev(a, "title", /*title*/ ctx[1]);
    			attr_dev(a, "class", /*styles*/ ctx[2]);
    			toggle_class(a, "active", spa_router_4(/*to*/ ctx[0]));
    			add_location(a, file$5, 24, 0, 482);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", /*navigate*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    				}
    			}

    			if (!current || dirty & /*to*/ 1) {
    				attr_dev(a, "href", /*to*/ ctx[0]);
    			}

    			if (!current || dirty & /*title*/ 2) {
    				attr_dev(a, "title", /*title*/ ctx[1]);
    			}

    			if (!current || dirty & /*styles*/ 4) {
    				attr_dev(a, "class", /*styles*/ ctx[2]);
    			}

    			if (dirty & /*styles, routeIsActive, to*/ 5) {
    				toggle_class(a, "active", spa_router_4(/*to*/ ctx[0]));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { to = "/" } = $$props;
    	let { title = "" } = $$props;
    	let { styles = "" } = $$props;
    	let { lang = null } = $$props;

    	onMount(function () {
    		if (lang) {
    			const route = spa_router_2(to, lang);

    			if (route) {
    				$$invalidate(0, to = route.path);
    			}
    		}
    	});

    	function navigate(event) {
    		event.preventDefault();
    		event.stopPropagation();
    		spa_router_3(to);
    	}

    	const writable_props = ["to", "title", "styles", "lang"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navigate> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Navigate", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("to" in $$props) $$invalidate(0, to = $$props.to);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("styles" in $$props) $$invalidate(2, styles = $$props.styles);
    		if ("lang" in $$props) $$invalidate(4, lang = $$props.lang);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		localisedRoute: spa_router_2,
    		navigateTo: spa_router_3,
    		routeIsActive: spa_router_4,
    		to,
    		title,
    		styles,
    		lang,
    		navigate
    	});

    	$$self.$inject_state = $$props => {
    		if ("to" in $$props) $$invalidate(0, to = $$props.to);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("styles" in $$props) $$invalidate(2, styles = $$props.styles);
    		if ("lang" in $$props) $$invalidate(4, lang = $$props.lang);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [to, title, styles, navigate, lang, $$scope, $$slots];
    }

    class Navigate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { to: 0, title: 1, styles: 2, lang: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigate",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get to() {
    		throw new Error("<Navigate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Navigate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Navigate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Navigate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styles() {
    		throw new Error("<Navigate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styles(value) {
    		throw new Error("<Navigate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lang() {
    		throw new Error("<Navigate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lang(value) {
    		throw new Error("<Navigate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var navigate = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Navigate
    });

    var Route$1 = getCjsExportFromNamespace(route$1);

    var Router$1 = getCjsExportFromNamespace(router$1);

    var Navigate$1 = getCjsExportFromNamespace(navigate);

    const { SpaRouter: SpaRouter$1, navigateTo: navigateTo$1, localisedRoute: localisedRoute$1, routeIsActive: routeIsActive$1 } = spa_router;




    var src = {
      SpaRouter: SpaRouter$1,
      localisedRoute: localisedRoute$1,
      navigateTo: navigateTo$1,
      routeIsActive: routeIsActive$1,
      Route: Route$1,
      Router: Router$1,
      Navigate: Navigate$1
    };
    var src_6 = src.Router;

    /* src/components/Logo.svelte generated by Svelte v3.21.0 */

    const file$6 = "src/components/Logo.svelte";

    function create_fragment$8(ctx) {
    	let svg;
    	let defs;
    	let path0;
    	let path1;
    	let path2;
    	let path3;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			add_location(defs, file$6, 0, 122, 122);
    			attr_dev(path0, "d", "M 66.665 167.274 C 66.852 167.256 67.044 167.24 67.242 167.226 C 67.441 167.212 67.629 167.205 67.803 167.205 C 67.855 167.202 67.917 167.2 67.985 167.197 C 68.043 167.194 68.111 167.192 68.19 167.191 C 68.268 167.19 68.352 167.19 68.445 167.19 C 68.543 167.19 68.646 167.191 68.755 167.193 C 68.865 167.196 68.974 167.2 69.085 167.205 C 69.096 167.064 69.107 166.919 69.117 166.769 C 69.129 166.619 69.138 166.475 69.148 166.335 C 69.157 166.196 69.165 166.067 69.172 165.95 C 69.178 165.83 69.184 165.732 69.189 165.653 L 69.189 165.414 C 69.189 165.349 69.189 165.284 69.189 165.219 C 69.189 165.154 69.191 165.103 69.197 165.063 C 69.216 164.985 69.254 164.946 69.312 164.946 C 69.347 164.946 69.373 164.95 69.391 164.958 C 69.409 164.965 69.443 164.978 69.491 164.995 C 69.514 165.002 69.54 165.012 69.567 165.024 C 69.595 165.036 69.622 165.048 69.648 165.062 C 69.675 165.074 69.699 165.086 69.719 165.098 C 69.74 165.112 69.756 165.123 69.768 165.133 C 69.778 165.142 69.791 165.158 69.806 165.18 C 69.822 165.202 69.838 165.226 69.854 165.252 C 69.87 165.277 69.883 165.304 69.895 165.331 C 69.904 165.358 69.908 165.381 69.907 165.4 C 69.903 165.419 69.896 165.488 69.886 165.605 C 69.876 165.723 69.862 165.879 69.846 166.073 C 69.83 166.265 69.813 166.489 69.795 166.743 C 69.777 166.999 69.76 167.273 69.744 167.563 C 69.72 168.03 69.707 168.419 69.707 168.728 C 69.707 168.96 69.712 169.147 69.722 169.291 C 69.732 169.433 69.744 169.534 69.76 169.592 C 69.783 169.69 69.8 169.761 69.809 169.803 C 69.821 169.845 69.821 169.872 69.806 169.886 C 69.801 169.891 69.793 169.897 69.783 169.901 C 69.757 169.911 69.714 169.92 69.653 169.928 C 69.642 169.954 69.631 169.975 69.621 169.99 C 69.61 170.006 69.6 170.018 69.589 170.028 C 69.579 170.037 69.568 170.044 69.557 170.051 C 69.531 170.058 69.506 170.065 69.483 170.072 C 69.459 170.079 69.44 170.077 69.426 170.067 C 69.418 170.063 69.412 170.06 69.406 170.056 C 69.396 170.05 69.387 170.038 69.379 170.017 C 69.353 170.026 69.328 170.026 69.308 170.017 C 69.296 170.012 69.288 170.007 69.28 170.002 C 69.259 169.986 69.229 169.957 69.189 169.915 C 69.149 169.873 69.123 169.815 69.11 169.742 C 69.105 169.708 69.096 169.67 69.084 169.628 C 69.072 169.588 69.06 169.546 69.048 169.503 C 69.036 169.459 69.025 169.417 69.012 169.376 C 69.001 169.335 68.993 169.297 68.987 169.262 C 68.979 169.229 68.976 169.16 68.977 169.055 C 68.978 168.949 68.982 168.826 68.989 168.687 C 68.995 168.546 69.004 168.396 69.014 168.237 C 69.026 168.077 69.036 167.928 69.047 167.787 C 69.047 167.769 69.047 167.749 69.047 167.728 C 69.047 167.707 69.049 167.683 69.055 167.657 C 68.936 167.653 68.819 167.65 68.703 167.65 C 68.588 167.65 68.478 167.65 68.374 167.65 C 68.241 167.65 68.12 167.65 68.013 167.651 C 67.904 167.653 67.809 167.656 67.728 167.657 C 67.633 167.659 67.547 167.662 67.47 167.665 C 67.19 167.665 66.921 167.671 66.659 167.686 C 66.656 167.721 66.653 167.751 66.652 167.777 C 66.651 167.802 66.651 167.825 66.651 167.843 L 66.651 167.896 C 66.645 168.125 66.64 168.346 66.636 168.557 C 66.63 168.767 66.626 168.955 66.624 169.121 C 66.62 169.288 66.618 169.426 66.617 169.536 C 66.616 169.646 66.616 169.714 66.619 169.742 C 66.619 169.765 66.617 169.79 66.616 169.816 C 66.613 169.84 66.608 169.868 66.602 169.899 C 66.595 169.93 66.584 169.965 66.571 170.002 C 66.545 170.005 66.521 170.013 66.497 170.028 C 66.485 170.034 66.475 170.04 66.465 170.046 C 66.441 170.06 66.419 170.075 66.399 170.092 C 66.38 170.11 66.363 170.113 66.347 170.101 C 66.325 170.087 66.299 170.077 66.269 170.072 C 66.238 170.069 66.2 170.067 66.156 170.067 C 66.134 170.067 66.111 170.061 66.088 170.049 C 66.064 170.037 66.042 170.023 66.021 170.007 C 66 169.993 65.982 169.975 65.967 169.957 C 65.951 169.938 65.94 169.922 65.937 169.907 C 65.933 169.893 65.926 169.873 65.917 169.846 C 65.909 169.819 65.903 169.791 65.897 169.762 C 65.891 169.733 65.884 169.705 65.879 169.678 C 65.873 169.652 65.869 169.632 65.866 169.62 C 65.864 169.608 65.864 169.55 65.866 169.445 C 65.869 169.338 65.874 169.199 65.882 169.028 C 65.89 168.856 65.899 168.658 65.911 168.435 C 65.92 168.211 65.932 167.976 65.946 167.728 C 65.846 167.736 65.761 167.744 65.693 167.751 C 65.624 167.756 65.581 167.762 65.566 167.766 C 65.536 167.771 65.513 167.775 65.496 167.782 C 65.479 167.787 65.465 167.793 65.453 167.798 C 65.442 167.802 65.431 167.805 65.418 167.806 C 65.409 167.807 65.398 167.806 65.386 167.801 C 65.371 167.801 65.356 167.793 65.341 167.775 C 65.328 167.757 65.318 167.736 65.312 167.713 C 65.283 167.709 65.264 167.7 65.255 167.688 C 65.246 167.674 65.239 167.665 65.233 167.657 C 65.233 167.639 65.243 167.625 65.264 167.617 C 65.282 167.609 65.314 167.585 65.357 167.548 C 65.374 167.532 65.402 167.517 65.438 167.502 C 65.472 167.486 65.51 167.47 65.55 167.456 C 65.59 167.443 65.629 167.431 65.667 167.421 C 65.706 167.41 65.739 167.402 65.767 167.397 L 65.961 167.37 C 65.977 167.14 65.993 166.931 66.009 166.741 C 66.024 166.551 66.039 166.375 66.052 166.214 C 66.066 166.053 66.078 165.903 66.086 165.763 C 66.095 165.624 66.1 165.489 66.1 165.358 C 66.1 165.32 66.099 165.284 66.097 165.252 C 66.094 165.219 66.093 165.184 66.093 165.147 C 66.093 165.119 66.102 165.095 66.119 165.074 C 66.135 165.054 66.157 165.042 66.184 165.037 L 66.232 165.037 C 66.26 165.037 66.314 165.041 66.394 165.048 C 66.404 165.024 66.416 165.01 66.429 165.003 C 66.437 164.998 66.444 164.995 66.449 164.995 C 66.47 164.995 66.487 165 66.502 165.009 C 66.517 165.017 66.526 165.024 66.532 165.031 C 66.532 165.035 66.534 165.04 66.535 165.045 C 66.538 165.052 66.542 165.062 66.547 165.076 C 66.569 165.081 66.584 165.086 66.595 165.092 C 66.606 165.095 66.616 165.1 66.624 165.105 C 66.632 165.112 66.638 165.116 66.642 165.118 L 66.654 165.139 C 66.662 165.153 66.669 165.18 66.677 165.22 C 66.697 165.255 66.71 165.28 66.714 165.295 C 66.717 165.304 66.718 165.309 66.718 165.311 C 66.718 165.317 66.719 165.323 66.722 165.329 C 66.722 165.335 66.722 165.339 66.723 165.343 C 66.725 165.348 66.727 165.353 66.727 165.358 L 66.665 167.274 Z M 72.97 168.002 C 72.974 168.083 72.966 168.183 72.946 168.302 C 72.928 168.42 72.907 168.546 72.884 168.681 C 72.86 168.816 72.838 168.953 72.816 169.092 C 72.795 169.233 72.784 169.366 72.784 169.489 C 72.784 169.571 72.791 169.649 72.805 169.723 C 72.818 169.797 72.84 169.861 72.872 169.915 C 72.89 169.945 72.9 169.972 72.901 169.996 C 72.901 170.019 72.9 170.039 72.896 170.058 C 72.89 170.074 72.884 170.09 72.879 170.102 C 72.874 170.115 72.874 170.128 72.879 170.14 C 72.884 170.152 72.883 170.165 72.876 170.18 C 72.868 170.195 72.856 170.209 72.84 170.222 C 72.824 170.235 72.807 170.244 72.786 170.251 C 72.766 170.256 72.749 170.254 72.734 170.244 C 72.705 170.229 72.681 170.22 72.664 170.216 C 72.646 170.214 72.632 170.215 72.62 170.22 C 72.607 170.222 72.597 170.226 72.588 170.231 C 72.579 170.236 72.568 170.236 72.554 170.231 C 72.51 170.21 72.461 170.185 72.409 170.158 C 72.356 170.129 72.322 170.099 72.306 170.067 C 72.295 170.052 72.284 170.028 72.276 169.996 C 72.266 169.963 72.258 169.924 72.252 169.88 C 72.245 169.836 72.239 169.787 72.233 169.735 C 72.229 169.685 72.224 169.634 72.221 169.585 C 72.135 169.73 72.041 169.851 71.943 169.946 C 71.844 170.042 71.744 170.119 71.646 170.177 C 71.546 170.234 71.449 170.274 71.353 170.297 C 71.256 170.321 71.169 170.333 71.089 170.333 C 71.007 170.333 70.935 170.324 70.873 170.305 C 70.811 170.286 70.763 170.263 70.73 170.238 C 70.599 170.124 70.509 170.03 70.454 169.958 C 70.4 169.888 70.376 169.83 70.382 169.784 C 70.394 169.635 70.434 169.497 70.503 169.371 C 70.572 169.244 70.658 169.128 70.762 169.021 C 70.864 168.915 70.979 168.819 71.108 168.733 C 71.235 168.648 71.365 168.571 71.499 168.506 C 71.633 168.438 71.764 168.382 71.894 168.336 C 72.023 168.291 72.14 168.254 72.245 168.227 C 72.241 168.1 72.235 167.988 72.229 167.894 C 72.221 167.799 72.212 167.73 72.198 167.686 C 72.158 167.541 72.098 167.432 72.015 167.36 C 71.935 167.289 71.836 167.254 71.719 167.254 C 71.646 167.254 71.57 167.277 71.495 167.328 C 71.42 167.377 71.352 167.443 71.292 167.527 C 71.231 167.612 71.182 167.71 71.144 167.819 C 71.105 167.929 71.084 168.044 71.081 168.167 C 71.081 168.197 71.083 168.225 71.086 168.253 C 71.088 168.281 71.092 168.311 71.098 168.342 C 71.1 168.358 71.094 168.37 71.08 168.376 C 71.064 168.383 71.047 168.389 71.027 168.393 C 71.006 168.396 70.982 168.4 70.959 168.402 C 70.936 168.404 70.916 168.408 70.901 168.412 C 70.887 168.416 70.876 168.42 70.868 168.422 C 70.86 168.423 70.852 168.421 70.844 168.417 C 70.836 168.414 70.827 168.408 70.814 168.397 C 70.803 168.388 70.787 168.377 70.765 168.363 C 70.744 168.349 70.721 168.337 70.699 168.329 C 70.677 168.318 70.657 168.31 70.64 168.303 C 70.624 168.296 70.608 168.29 70.596 168.284 C 70.585 168.278 70.579 168.27 70.579 168.261 C 70.579 168.116 70.616 167.966 70.687 167.812 C 70.761 167.657 70.858 167.516 70.981 167.39 C 71.104 167.262 71.247 167.157 71.409 167.074 C 71.571 166.993 71.744 166.952 71.926 166.952 C 72.074 166.952 72.201 166.972 72.31 167.011 C 72.418 167.051 72.51 167.103 72.587 167.166 C 72.663 167.229 72.725 167.298 72.774 167.376 C 72.823 167.454 72.862 167.532 72.888 167.609 C 72.917 167.689 72.937 167.763 72.948 167.831 C 72.961 167.9 72.968 167.957 72.97 168.002 M 72.253 168.627 C 72.175 168.653 72.087 168.687 71.992 168.728 C 71.898 168.77 71.801 168.82 71.703 168.877 C 71.605 168.935 71.509 169.001 71.41 169.076 C 71.312 169.151 71.221 169.234 71.137 169.325 C 71.037 169.43 70.964 169.525 70.919 169.606 C 70.874 169.688 70.846 169.758 70.836 169.815 C 70.826 169.872 70.828 169.918 70.844 169.949 C 70.86 169.983 70.879 170.002 70.901 170.009 C 70.981 170.037 71.067 170.04 71.156 170.018 C 71.243 169.996 71.332 169.956 71.421 169.899 C 71.509 169.842 71.594 169.773 71.678 169.692 C 71.76 169.611 71.84 169.528 71.915 169.443 C 71.987 169.357 72.053 169.273 72.111 169.19 C 72.169 169.107 72.216 169.035 72.253 168.974 L 72.253 168.627 Z M 75.849 167.7 C 75.854 167.732 75.858 167.769 75.861 167.81 C 75.864 167.851 75.866 167.893 75.866 167.938 C 75.866 168.05 75.86 168.182 75.849 168.331 C 75.839 168.481 75.826 168.659 75.81 168.865 C 75.804 168.944 75.8 169.046 75.798 169.169 C 75.794 169.292 75.792 169.418 75.792 169.55 C 75.792 169.662 75.795 169.771 75.8 169.876 C 75.804 169.982 75.811 170.074 75.819 170.153 C 75.823 170.188 75.813 170.207 75.789 170.21 C 75.766 170.212 75.74 170.209 75.711 170.203 C 75.698 170.198 75.686 170.198 75.675 170.203 C 75.664 170.208 75.655 170.214 75.646 170.221 C 75.636 170.228 75.626 170.233 75.617 170.235 C 75.609 170.24 75.596 170.235 75.581 170.224 C 75.567 170.215 75.544 170.2 75.512 170.182 C 75.481 170.163 75.447 170.142 75.411 170.12 C 75.376 170.098 75.343 170.074 75.312 170.049 C 75.279 170.022 75.255 169.999 75.239 169.978 C 75.223 169.945 75.213 169.864 75.209 169.735 C 75.203 169.606 75.2 169.451 75.2 169.27 L 75.2 168.795 C 75.202 168.691 75.207 168.59 75.215 168.488 C 75.223 168.389 75.233 168.292 75.244 168.198 C 75.254 168.104 75.263 168.016 75.271 167.933 C 75.279 167.85 75.283 167.775 75.283 167.707 C 75.283 167.599 75.266 167.518 75.232 167.464 C 75.224 167.455 75.2 167.461 75.16 167.482 C 75.12 167.503 75.069 167.547 75.007 167.615 C 74.945 167.683 74.876 167.779 74.798 167.903 C 74.72 168.027 74.638 168.187 74.553 168.384 C 74.467 168.581 74.379 168.818 74.291 169.097 C 74.203 169.376 74.119 169.703 74.039 170.08 C 74.032 170.113 74.022 170.135 74.011 170.149 C 73.998 170.161 73.976 170.168 73.944 170.168 C 73.923 170.168 73.906 170.153 73.89 170.123 C 73.876 170.094 73.858 170.07 73.838 170.051 C 73.788 170.051 73.742 170.046 73.701 170.037 C 73.66 170.025 73.635 169.996 73.627 169.949 C 73.627 169.933 73.623 169.919 73.613 169.904 C 73.605 169.89 73.593 169.874 73.581 169.856 C 73.57 169.839 73.56 169.821 73.551 169.801 C 73.542 169.781 73.537 169.757 73.537 169.729 C 73.545 169.565 73.552 169.387 73.556 169.193 C 73.561 169 73.568 168.802 73.574 168.6 C 73.581 168.397 73.587 168.194 73.591 167.991 C 73.597 167.787 73.604 167.593 73.612 167.405 C 73.619 167.221 73.627 167.046 73.634 166.886 C 73.641 166.726 73.649 166.587 73.659 166.471 C 73.691 166.121 73.722 165.847 73.754 165.647 C 73.786 165.447 73.807 165.331 73.814 165.298 C 73.822 165.274 73.83 165.256 73.838 165.246 C 73.846 165.233 73.854 165.225 73.86 165.22 C 73.866 165.216 73.87 165.212 73.876 165.21 C 73.879 165.207 73.882 165.202 73.886 165.193 C 73.89 165.183 73.9 165.178 73.915 165.177 C 73.929 165.175 73.946 165.175 73.965 165.177 C 73.983 165.178 74 165.178 74.016 165.177 C 74.032 165.175 74.045 165.169 74.056 165.16 C 74.077 165.146 74.094 165.135 74.108 165.126 C 74.123 165.116 74.149 165.113 74.186 165.113 C 74.231 165.107 74.266 165.107 74.29 165.114 C 74.313 165.119 74.327 165.142 74.333 165.183 C 74.341 165.255 74.343 165.35 74.34 165.466 C 74.338 165.584 74.331 165.712 74.322 165.852 C 74.31 165.993 74.298 166.141 74.286 166.297 C 74.273 166.453 74.258 166.605 74.244 166.756 C 74.229 166.905 74.216 167.047 74.203 167.181 C 74.192 167.316 74.184 167.431 74.178 167.527 C 74.173 167.581 74.17 167.646 74.167 167.721 C 74.167 167.798 74.166 167.88 74.166 167.967 C 74.166 168.055 74.166 168.146 74.166 168.242 C 74.166 168.337 74.165 168.429 74.163 168.52 C 74.245 168.296 74.333 168.1 74.428 167.933 C 74.523 167.765 74.618 167.626 74.713 167.514 C 74.808 167.401 74.9 167.316 74.989 167.257 C 75.077 167.199 75.155 167.165 75.224 167.156 C 75.239 167.153 75.267 167.156 75.308 167.166 C 75.35 167.175 75.393 167.186 75.438 167.197 C 75.482 167.209 75.523 167.221 75.56 167.233 C 75.597 167.246 75.618 167.255 75.624 167.26 C 75.634 167.273 75.65 167.288 75.672 167.308 C 75.692 167.328 75.715 167.354 75.735 167.387 C 75.758 167.419 75.78 167.461 75.8 167.514 C 75.821 167.565 75.837 167.626 75.849 167.7 Z M 78.969 169.907 C 78.969 169.935 78.958 169.966 78.937 170 C 78.914 170.034 78.881 170.051 78.839 170.051 C 78.815 170.051 78.797 170.046 78.782 170.035 C 78.77 170.023 78.758 170.017 78.744 170.017 C 78.725 170.017 78.707 170.023 78.69 170.035 C 78.673 170.046 78.645 170.051 78.606 170.051 C 78.553 170.051 78.507 170.034 78.468 170 C 78.431 169.966 78.399 169.923 78.375 169.871 C 78.352 169.818 78.334 169.762 78.322 169.699 C 78.31 169.637 78.305 169.58 78.305 169.525 C 78.305 169.42 78.31 169.3 78.318 169.167 C 78.327 169.031 78.338 168.892 78.35 168.752 C 78.362 168.609 78.371 168.468 78.381 168.329 C 78.391 168.188 78.395 168.057 78.395 167.938 C 78.395 167.779 78.384 167.655 78.36 167.566 C 78.336 167.477 78.293 167.433 78.234 167.433 C 78.175 167.44 78.115 167.485 78.055 167.566 C 77.994 167.647 77.932 167.753 77.869 167.881 C 77.806 168.008 77.743 168.151 77.683 168.312 C 77.622 168.473 77.563 168.636 77.506 168.804 C 77.449 168.971 77.397 169.134 77.347 169.292 C 77.296 169.45 77.251 169.59 77.211 169.714 C 77.172 169.839 77.138 169.939 77.108 170.016 C 77.08 170.091 77.059 170.129 77.05 170.129 C 77.028 170.129 77.012 170.125 77.002 170.117 C 76.991 170.108 76.981 170.099 76.971 170.09 C 76.962 170.081 76.951 170.073 76.938 170.065 C 76.925 170.056 76.904 170.051 76.879 170.051 C 76.856 170.051 76.839 170.054 76.831 170.059 C 76.823 170.064 76.814 170.07 76.803 170.077 C 76.793 170.084 76.78 170.09 76.764 170.093 C 76.748 170.098 76.721 170.101 76.681 170.101 C 76.634 170.101 76.587 170.09 76.541 170.07 C 76.495 170.049 76.472 170.016 76.472 169.97 C 76.472 169.942 76.477 169.884 76.487 169.797 C 76.497 169.709 76.509 169.602 76.524 169.475 C 76.538 169.347 76.554 169.204 76.571 169.046 C 76.59 168.888 76.605 168.725 76.619 168.557 C 76.633 168.388 76.646 168.219 76.657 168.05 C 76.668 167.882 76.672 167.721 76.672 167.569 C 76.672 167.494 76.672 167.424 76.669 167.36 C 76.666 167.296 76.664 167.234 76.664 167.177 C 76.664 167.162 76.672 167.156 76.688 167.156 C 76.721 167.156 76.746 167.16 76.762 167.171 C 76.779 167.181 76.791 167.193 76.799 167.205 C 76.807 167.216 76.811 167.227 76.813 167.238 C 76.814 167.248 76.816 167.254 76.819 167.254 C 76.827 167.254 76.836 167.249 76.847 167.242 C 76.858 167.233 76.869 167.224 76.88 167.215 C 76.893 167.206 76.904 167.197 76.914 167.188 C 76.925 167.18 76.933 167.177 76.941 167.177 L 76.982 167.177 C 77.022 167.177 77.049 167.171 77.064 167.16 C 77.08 167.15 77.092 167.138 77.098 167.126 C 77.105 167.113 77.11 167.101 77.112 167.09 C 77.116 167.08 77.124 167.074 77.136 167.074 C 77.144 167.074 77.155 167.08 77.169 167.09 C 77.184 167.101 77.198 167.118 77.213 167.144 C 77.228 167.168 77.24 167.2 77.251 167.239 C 77.262 167.279 77.267 167.328 77.267 167.383 C 77.267 167.458 77.264 167.553 77.258 167.668 C 77.251 167.783 77.242 167.905 77.234 168.035 C 77.224 168.165 77.216 168.296 77.206 168.427 C 77.198 168.56 77.194 168.681 77.191 168.788 C 77.221 168.688 77.256 168.576 77.296 168.453 C 77.338 168.33 77.386 168.205 77.44 168.079 C 77.494 167.952 77.552 167.829 77.615 167.709 C 77.678 167.588 77.747 167.48 77.821 167.387 C 77.895 167.294 77.972 167.218 78.055 167.16 C 78.137 167.103 78.223 167.074 78.312 167.074 C 78.455 167.074 78.572 167.098 78.664 167.145 C 78.754 167.191 78.827 167.257 78.879 167.338 C 78.931 167.42 78.967 167.516 78.987 167.626 C 79.007 167.736 79.018 167.854 79.018 167.979 C 79.018 168.087 79.012 168.201 79.001 168.32 C 78.99 168.437 78.979 168.555 78.967 168.673 C 78.956 168.792 78.946 168.909 78.937 169.024 C 78.927 169.137 78.921 169.244 78.921 169.346 C 78.921 169.469 78.929 169.581 78.945 169.682 C 78.961 169.781 78.969 169.856 78.969 169.907 Z M 87.146 165.326 C 87.146 165.335 87.124 165.384 87.079 165.474 C 87.034 165.563 86.974 165.68 86.898 165.827 C 86.822 165.972 86.73 166.143 86.626 166.338 C 86.522 166.531 86.411 166.737 86.291 166.955 C 86.173 167.173 86.05 167.397 85.923 167.629 C 85.797 167.861 85.673 168.088 85.55 168.311 C 85.427 168.532 85.309 168.744 85.197 168.947 C 85.083 169.15 84.983 169.331 84.896 169.489 C 84.806 169.649 84.733 169.782 84.674 169.888 C 84.615 169.995 84.576 170.063 84.558 170.093 C 84.549 170.112 84.537 170.123 84.524 170.126 C 84.509 170.128 84.492 170.129 84.47 170.129 C 84.454 170.129 84.443 170.126 84.436 170.12 C 84.429 170.114 84.422 170.114 84.414 170.122 C 84.396 170.132 84.379 170.132 84.36 170.12 C 84.343 170.109 84.33 170.108 84.323 170.116 C 84.293 170.138 84.271 170.152 84.256 170.155 C 84.24 170.158 84.232 170.145 84.232 170.116 C 84.235 170.057 84.226 169.963 84.203 169.833 C 84.18 169.702 84.148 169.55 84.106 169.373 C 84.066 169.196 84.018 169.004 83.963 168.795 C 83.908 168.586 83.849 168.374 83.789 168.157 C 83.728 167.938 83.667 167.722 83.607 167.508 C 83.546 167.296 83.488 167.098 83.432 166.914 C 83.377 166.731 83.328 166.567 83.285 166.425 C 83.244 166.282 83.211 166.173 83.187 166.098 C 83.147 166.187 83.094 166.308 83.029 166.462 C 82.962 166.615 82.889 166.787 82.81 166.98 C 82.732 167.172 82.648 167.376 82.56 167.594 C 82.474 167.808 82.387 168.024 82.3 168.237 C 82.212 168.45 82.13 168.655 82.053 168.853 C 81.975 169.051 81.905 169.226 81.845 169.379 C 81.783 169.532 81.735 169.657 81.698 169.753 C 81.662 169.849 81.641 169.903 81.638 169.915 C 81.633 169.922 81.625 169.932 81.617 169.943 C 81.61 169.954 81.601 169.968 81.591 169.984 C 81.58 169.999 81.565 170.017 81.544 170.038 C 81.526 170.043 81.511 170.046 81.498 170.049 C 81.486 170.05 81.473 170.051 81.461 170.051 C 81.442 170.061 81.426 170.07 81.413 170.079 C 81.4 170.086 81.387 170.092 81.376 170.098 C 81.366 170.105 81.356 170.111 81.346 170.116 C 81.332 170.126 81.319 170.135 81.305 170.143 C 81.293 170.15 81.28 170.156 81.267 170.161 C 81.261 170.161 81.25 170.158 81.233 170.153 C 81.216 170.149 81.198 170.144 81.181 170.137 C 81.164 170.129 81.147 170.122 81.131 170.113 C 81.116 170.105 81.106 170.096 81.104 170.087 C 81.091 170.055 81.069 169.993 81.04 169.904 C 81.011 169.815 80.976 169.705 80.935 169.575 C 80.895 169.443 80.85 169.294 80.8 169.128 C 80.752 168.962 80.699 168.786 80.644 168.601 C 80.586 168.416 80.528 168.225 80.468 168.029 C 80.409 167.832 80.35 167.636 80.292 167.443 C 80.247 167.292 80.199 167.136 80.15 166.976 C 80.098 166.818 80.049 166.66 80 166.505 C 79.948 166.35 79.9 166.203 79.853 166.063 C 79.808 165.923 79.766 165.796 79.727 165.683 C 79.689 165.569 79.657 165.473 79.631 165.394 C 79.604 165.316 79.586 165.263 79.578 165.235 C 79.574 165.214 79.581 165.197 79.601 165.184 C 79.621 165.171 79.643 165.174 79.666 165.193 C 79.684 165.204 79.699 165.205 79.712 165.196 C 79.723 165.187 79.736 165.183 79.749 165.183 C 79.757 165.183 79.769 165.184 79.786 165.189 C 79.804 165.193 79.822 165.199 79.84 165.205 C 79.86 165.211 79.878 165.217 79.894 165.225 C 79.911 165.231 79.925 165.237 79.935 165.241 C 79.946 165.246 79.954 165.247 79.957 165.246 C 79.961 165.243 79.965 165.237 79.968 165.231 C 79.973 165.223 79.977 165.216 79.98 165.21 C 79.985 165.202 79.995 165.197 80.008 165.193 C 80.036 165.183 80.063 165.184 80.09 165.196 C 80.117 165.208 80.14 165.216 80.162 165.22 C 80.177 165.222 80.185 165.222 80.185 165.216 C 80.185 165.21 80.184 165.202 80.183 165.195 C 80.183 165.187 80.183 165.18 80.187 165.174 C 80.191 165.168 80.205 165.166 80.228 165.168 C 80.266 165.168 80.297 165.175 80.322 165.19 C 80.346 165.206 80.37 165.252 80.391 165.326 C 80.397 165.344 80.415 165.401 80.445 165.496 C 80.474 165.591 80.513 165.711 80.558 165.86 C 80.606 166.007 80.658 166.175 80.716 166.362 C 80.774 166.549 80.835 166.744 80.898 166.946 C 80.961 167.148 81.026 167.352 81.091 167.557 C 81.155 167.762 81.216 167.956 81.275 168.142 C 81.332 168.326 81.384 168.494 81.43 168.643 C 81.476 168.793 81.514 168.915 81.544 169.008 C 81.617 168.88 81.701 168.718 81.793 168.524 C 81.886 168.327 81.98 168.117 82.077 167.893 C 82.175 167.668 82.273 167.437 82.371 167.202 C 82.468 166.967 82.56 166.744 82.647 166.534 C 82.733 166.323 82.808 166.134 82.873 165.965 C 82.94 165.796 82.99 165.667 83.023 165.578 C 83.045 165.524 83.06 165.476 83.069 165.433 C 83.079 165.39 83.092 165.35 83.108 165.311 C 83.124 165.284 83.146 165.252 83.176 165.217 C 83.204 165.182 83.225 165.161 83.238 165.154 C 83.275 165.14 83.306 165.135 83.331 165.137 C 83.356 165.142 83.387 165.148 83.424 165.154 C 83.438 165.157 83.446 165.154 83.449 165.147 C 83.454 165.139 83.457 165.131 83.459 165.122 C 83.462 165.11 83.467 165.098 83.471 165.086 C 83.477 165.075 83.491 165.065 83.512 165.055 C 83.577 165.025 83.618 165.012 83.633 165.016 C 83.649 165.021 83.666 165.051 83.682 165.105 C 83.685 165.116 83.698 165.169 83.723 165.265 C 83.748 165.36 83.781 165.482 83.823 165.632 C 83.864 165.782 83.91 165.954 83.961 166.147 C 84.012 166.342 84.067 166.545 84.127 166.756 C 84.187 166.966 84.247 167.178 84.306 167.392 C 84.365 167.606 84.423 167.808 84.48 167.999 C 84.537 168.189 84.589 168.363 84.639 168.518 C 84.688 168.675 84.728 168.799 84.762 168.893 C 84.797 168.827 84.847 168.737 84.911 168.622 C 84.976 168.508 85.05 168.377 85.13 168.228 C 85.213 168.08 85.303 167.917 85.401 167.742 C 85.498 167.569 85.596 167.39 85.698 167.205 C 85.799 167.02 85.898 166.833 85.996 166.647 C 86.095 166.462 86.188 166.282 86.276 166.108 C 86.362 165.936 86.443 165.774 86.514 165.623 C 86.587 165.471 86.647 165.34 86.692 165.228 C 86.7 165.207 86.712 165.186 86.73 165.165 C 86.749 165.144 86.769 165.125 86.788 165.106 C 86.808 165.089 86.827 165.075 86.844 165.064 C 86.861 165.053 86.871 165.048 86.877 165.048 C 86.899 165.053 86.918 165.059 86.936 165.065 C 86.956 165.073 86.969 165.083 86.977 165.097 C 86.987 165.107 86.993 165.116 86.994 165.125 C 86.995 165.132 86.997 165.139 86.998 165.147 C 87 165.154 87.003 165.159 87.008 165.163 C 87.013 165.166 87.024 165.168 87.039 165.168 C 87.066 165.168 87.083 165.174 87.092 165.186 C 87.1 165.198 87.104 165.209 87.106 165.22 C 87.107 165.232 87.108 165.244 87.108 165.255 C 87.108 165.265 87.112 165.267 87.123 165.262 C 87.136 165.262 87.144 165.271 87.144 165.289 C 87.145 165.308 87.146 165.319 87.146 165.326 Z M 89.25 168.778 C 89.25 168.803 89.251 168.833 89.254 168.868 C 89.255 168.903 89.257 168.944 89.257 168.987 C 89.257 169.043 89.248 169.114 89.23 169.198 C 89.211 169.28 89.181 169.368 89.14 169.458 C 89.099 169.55 89.045 169.641 88.977 169.732 C 88.908 169.823 88.823 169.905 88.723 169.978 C 88.623 170.05 88.505 170.11 88.368 170.155 C 88.232 170.2 88.077 170.224 87.903 170.224 C 87.747 170.224 87.588 170.197 87.425 170.144 C 87.263 170.092 87.116 170.01 86.982 169.899 C 86.848 169.788 86.739 169.646 86.653 169.475 C 86.567 169.302 86.525 169.096 86.525 168.858 C 86.525 168.708 86.546 168.56 86.59 168.415 C 86.634 168.271 86.692 168.134 86.765 168.005 C 86.836 167.876 86.922 167.757 87.022 167.648 C 87.12 167.54 87.225 167.446 87.334 167.369 C 87.445 167.289 87.558 167.227 87.675 167.183 C 87.792 167.138 87.906 167.117 88.018 167.117 C 88.211 167.117 88.37 167.144 88.495 167.197 C 88.619 167.252 88.72 167.318 88.794 167.397 C 88.868 167.476 88.92 167.562 88.951 167.651 C 88.981 167.742 88.997 167.824 88.997 167.896 C 88.997 167.966 88.977 168.047 88.939 168.136 C 88.9 168.227 88.838 168.312 88.749 168.393 C 88.663 168.474 88.55 168.542 88.41 168.597 C 88.269 168.651 88.097 168.679 87.894 168.679 C 87.787 168.679 87.69 168.666 87.604 168.639 C 87.519 168.612 87.442 168.577 87.376 168.537 C 87.31 168.496 87.254 168.452 87.207 168.403 C 87.161 168.355 87.123 168.311 87.091 168.269 C 87.043 168.413 87.02 168.583 87.02 168.778 C 87.02 168.911 87.042 169.03 87.086 169.137 C 87.128 169.243 87.188 169.334 87.265 169.409 C 87.341 169.483 87.433 169.541 87.539 169.581 C 87.645 169.621 87.76 169.641 87.886 169.641 C 88.045 169.641 88.184 169.617 88.302 169.569 C 88.422 169.521 88.525 169.46 88.613 169.388 C 88.702 169.316 88.778 169.237 88.843 169.151 C 88.908 169.066 88.965 168.987 89.012 168.915 C 89.059 168.845 89.101 168.786 89.136 168.739 C 89.172 168.692 89.207 168.669 89.242 168.672 C 89.258 168.672 89.265 168.684 89.265 168.708 C 89.265 168.719 89.264 168.731 89.262 168.742 C 89.258 168.754 89.254 168.766 89.25 168.778 M 88.057 167.472 C 88.01 167.472 87.948 167.48 87.873 167.497 C 87.798 167.515 87.718 167.546 87.634 167.59 C 87.552 167.636 87.47 167.695 87.388 167.772 C 87.306 167.847 87.234 167.944 87.173 168.061 C 87.21 168.044 87.244 168.03 87.271 168.019 C 87.299 168.008 87.318 168.002 87.329 168.002 C 87.335 168.002 87.342 168.007 87.352 168.015 C 87.413 168.106 87.489 168.171 87.58 168.21 C 87.672 168.249 87.774 168.269 87.886 168.269 C 87.976 168.269 88.054 168.255 88.118 168.228 C 88.183 168.201 88.236 168.167 88.278 168.125 C 88.321 168.082 88.352 168.035 88.37 167.986 C 88.389 167.935 88.399 167.885 88.399 167.836 C 88.399 167.731 88.368 167.644 88.307 167.575 C 88.246 167.506 88.163 167.472 88.057 167.472 Z M 90.599 165.298 C 90.598 165.314 90.593 165.366 90.586 165.456 C 90.579 165.544 90.572 165.656 90.562 165.791 C 90.552 165.925 90.541 166.075 90.53 166.241 C 90.518 166.405 90.506 166.571 90.495 166.738 C 90.483 166.903 90.472 167.063 90.463 167.217 C 90.454 167.37 90.447 167.502 90.441 167.615 C 90.476 167.563 90.521 167.512 90.576 167.461 C 90.631 167.409 90.698 167.363 90.775 167.322 C 90.853 167.281 90.944 167.248 91.046 167.221 C 91.147 167.195 91.261 167.183 91.387 167.183 C 91.548 167.183 91.709 167.209 91.869 167.26 C 92.028 167.313 92.171 167.392 92.297 167.497 C 92.425 167.604 92.528 167.74 92.606 167.905 C 92.686 168.07 92.724 168.266 92.724 168.494 C 92.724 168.683 92.697 168.855 92.641 169.008 C 92.584 169.164 92.511 169.301 92.419 169.422 C 92.328 169.542 92.224 169.646 92.109 169.735 C 91.992 169.824 91.875 169.898 91.755 169.957 C 91.637 170.016 91.522 170.06 91.41 170.087 C 91.3 170.115 91.204 170.129 91.122 170.129 C 91.037 170.129 90.959 170.123 90.887 170.108 C 90.814 170.094 90.75 170.077 90.696 170.056 C 90.642 170.035 90.599 170.011 90.57 169.986 C 90.538 169.96 90.522 169.933 90.52 169.907 C 90.514 169.853 90.514 169.796 90.518 169.735 C 90.521 169.674 90.546 169.624 90.591 169.585 C 90.634 169.548 90.67 169.525 90.701 169.518 C 90.732 169.511 90.761 169.524 90.79 169.557 C 90.818 169.59 90.836 169.625 90.843 169.665 C 90.85 169.705 90.845 169.735 90.83 169.756 C 90.822 169.768 90.822 169.778 90.831 169.786 C 90.84 169.795 90.855 169.802 90.875 169.807 C 90.894 169.813 90.916 169.818 90.942 169.822 C 90.968 169.825 90.992 169.827 91.015 169.827 C 91.105 169.827 91.208 169.794 91.323 169.731 C 91.437 169.666 91.545 169.576 91.645 169.463 C 91.746 169.348 91.83 169.213 91.899 169.058 C 91.967 168.903 92 168.736 91.997 168.557 C 91.995 168.413 91.975 168.288 91.938 168.182 C 91.901 168.076 91.855 167.986 91.799 167.912 C 91.744 167.838 91.682 167.778 91.612 167.731 C 91.542 167.684 91.474 167.648 91.405 167.625 C 91.338 167.6 91.274 167.583 91.215 167.576 C 91.156 167.57 91.108 167.567 91.071 167.569 C 90.916 167.585 90.781 167.633 90.67 167.711 C 90.561 167.79 90.48 167.889 90.429 168.009 C 90.421 168.257 90.411 168.507 90.4 168.758 C 90.388 169.01 90.382 169.244 90.382 169.463 C 90.382 169.569 90.383 169.673 90.386 169.771 C 90.391 169.869 90.4 169.955 90.414 170.03 C 90.416 170.055 90.415 170.071 90.412 170.08 C 90.407 170.089 90.4 170.093 90.39 170.093 C 90.378 170.093 90.367 170.091 90.354 170.087 C 90.342 170.081 90.329 170.077 90.317 170.072 C 90.308 170.069 90.305 170.074 90.311 170.09 C 90.315 170.107 90.319 170.124 90.321 170.141 C 90.322 170.159 90.318 170.172 90.309 170.18 C 90.298 170.188 90.274 170.182 90.235 170.161 C 90.215 170.145 90.189 170.132 90.158 170.123 C 90.128 170.115 90.117 170.121 90.125 170.14 C 90.127 170.147 90.119 170.15 90.101 170.152 C 90.082 170.153 90.06 170.15 90.035 170.143 C 90.01 170.135 89.987 170.123 89.964 170.103 C 89.942 170.086 89.926 170.06 89.918 170.025 C 89.905 169.951 89.892 169.874 89.88 169.791 C 89.869 169.707 89.859 169.615 89.851 169.517 C 89.843 169.417 89.836 169.306 89.831 169.187 C 89.826 169.066 89.824 168.93 89.824 168.778 C 89.824 168.663 89.824 168.539 89.826 168.403 C 89.827 168.269 89.832 168.121 89.839 167.958 C 89.849 167.666 89.862 167.378 89.878 167.093 C 89.894 166.806 89.912 166.545 89.93 166.307 C 89.949 166.07 89.969 165.866 89.991 165.695 C 90.014 165.524 90.038 165.406 90.065 165.343 C 90.07 165.32 90.081 165.306 90.097 165.301 C 90.116 165.297 90.148 165.289 90.196 165.277 C 90.241 165.265 90.288 165.253 90.336 165.241 C 90.384 165.23 90.422 165.228 90.449 165.235 C 90.46 165.239 90.474 165.239 90.493 165.235 C 90.511 165.23 90.529 165.228 90.545 165.228 C 90.562 165.228 90.578 165.232 90.59 165.241 C 90.602 165.251 90.605 165.27 90.599 165.298 Z M 94.598 165.894 C 94.598 165.897 94.598 165.934 94.597 166.004 C 94.595 166.073 94.595 166.167 94.594 166.284 C 94.591 166.402 94.59 166.537 94.588 166.691 C 94.587 166.846 94.586 167.009 94.583 167.181 C 94.58 167.354 94.578 167.529 94.577 167.71 C 94.575 167.89 94.574 168.063 94.573 168.231 C 94.572 168.4 94.571 168.555 94.569 168.7 C 94.567 168.845 94.566 168.968 94.566 169.072 L 94.566 169.283 C 94.604 169.288 94.64 169.291 94.676 169.291 C 94.712 169.291 94.749 169.291 94.785 169.291 C 94.896 169.291 95.029 169.281 95.183 169.262 C 95.337 169.243 95.504 169.202 95.681 169.14 C 95.86 169.078 96.046 168.989 96.24 168.87 C 96.435 168.752 96.625 168.592 96.812 168.391 C 97.037 168.153 97.198 167.914 97.293 167.676 C 97.39 167.437 97.438 167.197 97.438 166.958 C 97.438 166.757 97.414 166.583 97.366 166.435 C 97.319 166.288 97.252 166.164 97.167 166.063 C 97.081 165.96 96.98 165.877 96.863 165.813 C 96.744 165.75 96.614 165.701 96.474 165.666 C 96.333 165.631 96.183 165.608 96.023 165.595 C 95.863 165.584 95.699 165.578 95.533 165.578 C 95.415 165.578 95.278 165.591 95.123 165.617 C 94.965 165.643 94.806 165.676 94.641 165.716 C 94.476 165.755 94.312 165.797 94.151 165.841 C 93.99 165.887 93.844 165.929 93.714 165.969 C 93.583 166.008 93.474 166.041 93.387 166.066 C 93.301 166.093 93.247 166.105 93.229 166.105 C 93.202 166.081 93.18 166.059 93.16 166.038 C 93.145 166.022 93.131 166.007 93.119 165.993 C 93.105 165.979 93.099 165.971 93.099 165.969 C 93.099 165.964 93.102 165.958 93.11 165.951 C 93.115 165.946 93.124 165.94 93.137 165.933 C 93.151 165.926 93.171 165.92 93.197 165.915 C 93.188 165.901 93.184 165.892 93.182 165.889 C 93.181 165.883 93.18 165.878 93.18 165.873 C 93.18 165.866 93.182 165.859 93.185 165.852 C 93.188 165.845 93.201 165.838 93.221 165.831 C 93.18 165.815 93.152 165.8 93.137 165.788 C 93.121 165.775 93.111 165.764 93.108 165.758 C 93.104 165.751 93.103 165.746 93.107 165.744 C 93.109 165.742 93.11 165.742 93.11 165.744 C 93.11 165.736 93.115 165.732 93.125 165.729 C 93.136 165.727 93.144 165.721 93.148 165.708 C 93.148 165.706 93.156 165.691 93.172 165.664 C 93.188 165.634 93.222 165.601 93.274 165.564 C 93.326 165.527 93.399 165.489 93.494 165.449 C 93.589 165.409 93.718 165.373 93.879 165.343 C 93.934 165.332 94.009 165.317 94.104 165.297 C 94.199 165.276 94.309 165.257 94.435 165.238 C 94.56 165.219 94.696 165.202 94.843 165.189 C 94.993 165.175 95.148 165.168 95.308 165.168 C 95.748 165.168 96.139 165.225 96.479 165.341 C 96.821 165.457 97.107 165.613 97.338 165.807 C 97.568 166.001 97.742 166.226 97.861 166.481 C 97.981 166.736 98.04 167.003 98.04 167.281 C 98.04 167.445 98.015 167.615 97.964 167.787 C 97.914 167.961 97.844 168.131 97.75 168.3 C 97.655 168.468 97.542 168.632 97.41 168.788 C 97.278 168.945 97.131 169.089 96.968 169.219 C 96.803 169.348 96.626 169.462 96.439 169.56 C 96.249 169.658 96.051 169.734 95.842 169.784 C 95.634 169.837 95.445 169.872 95.274 169.892 C 95.104 169.912 94.948 169.922 94.805 169.922 C 94.614 169.922 94.459 169.912 94.341 169.892 C 94.222 169.872 94.13 169.85 94.066 169.825 C 94.002 169.801 93.958 169.777 93.936 169.753 C 93.914 169.73 93.902 169.715 93.902 169.708 C 93.887 169.694 93.879 169.672 93.879 169.641 C 93.881 169.584 93.887 169.424 93.897 169.157 C 93.903 169.044 93.909 168.902 93.916 168.731 C 93.922 168.561 93.93 168.354 93.939 168.112 C 93.948 167.87 93.96 167.585 93.975 167.26 C 93.99 166.934 94.006 166.561 94.024 166.14 C 94.024 166.091 94.04 166.057 94.069 166.038 C 94.101 166.02 94.138 166.006 94.182 165.996 C 94.228 165.987 94.276 165.978 94.328 165.971 C 94.379 165.962 94.424 165.943 94.463 165.915 C 94.48 165.903 94.499 165.894 94.517 165.885 C 94.537 165.877 94.554 165.873 94.566 165.873 C 94.588 165.873 94.598 165.88 94.598 165.894 Z M 101.184 168.778 C 101.184 168.803 101.186 168.833 101.188 168.868 C 101.19 168.903 101.192 168.944 101.192 168.987 C 101.192 169.043 101.183 169.114 101.164 169.198 C 101.145 169.28 101.115 169.368 101.074 169.458 C 101.034 169.55 100.98 169.641 100.911 169.732 C 100.842 169.823 100.758 169.905 100.658 169.978 C 100.557 170.05 100.439 170.11 100.303 170.155 C 100.166 170.2 100.011 170.224 99.838 170.224 C 99.681 170.224 99.522 170.197 99.36 170.144 C 99.198 170.092 99.05 170.01 98.918 169.899 C 98.784 169.788 98.674 169.646 98.588 169.475 C 98.502 169.302 98.459 169.096 98.459 168.858 C 98.459 168.708 98.481 168.56 98.525 168.415 C 98.569 168.271 98.626 168.134 98.699 168.005 C 98.772 167.876 98.857 167.757 98.956 167.648 C 99.055 167.54 99.16 167.446 99.269 167.369 C 99.379 167.289 99.493 167.227 99.61 167.183 C 99.727 167.138 99.842 167.117 99.954 167.117 C 100.145 167.117 100.304 167.144 100.43 167.197 C 100.554 167.252 100.655 167.318 100.729 167.397 C 100.803 167.476 100.855 167.562 100.886 167.651 C 100.916 167.742 100.932 167.824 100.932 167.896 C 100.932 167.966 100.912 168.047 100.874 168.136 C 100.835 168.227 100.773 168.312 100.684 168.393 C 100.598 168.474 100.485 168.542 100.345 168.597 C 100.204 168.651 100.032 168.679 99.83 168.679 C 99.722 168.679 99.624 168.666 99.539 168.639 C 99.453 168.612 99.377 168.577 99.311 168.537 C 99.245 168.496 99.188 168.452 99.142 168.403 C 99.096 168.355 99.058 168.311 99.025 168.269 C 98.978 168.413 98.955 168.583 98.955 168.778 C 98.955 168.911 98.976 169.03 99.02 169.137 C 99.063 169.243 99.123 169.334 99.2 169.409 C 99.276 169.483 99.367 169.541 99.473 169.581 C 99.579 169.621 99.695 169.641 99.821 169.641 C 99.98 169.641 100.119 169.617 100.237 169.569 C 100.357 169.521 100.46 169.46 100.548 169.388 C 100.637 169.316 100.713 169.237 100.777 169.151 C 100.842 169.066 100.899 168.987 100.946 168.915 C 100.994 168.845 101.036 168.786 101.071 168.739 C 101.107 168.692 101.142 168.669 101.176 168.672 C 101.192 168.672 101.2 168.684 101.2 168.708 C 101.2 168.719 101.199 168.731 101.196 168.742 C 101.193 168.754 101.189 168.766 101.184 168.778 M 99.992 167.472 C 99.945 167.472 99.883 167.48 99.807 167.497 C 99.732 167.515 99.653 167.546 99.57 167.59 C 99.487 167.636 99.405 167.695 99.323 167.772 C 99.241 167.847 99.169 167.944 99.108 168.061 C 99.145 168.044 99.178 168.03 99.206 168.019 C 99.233 168.008 99.253 168.002 99.264 168.002 C 99.27 168.002 99.277 168.007 99.287 168.015 C 99.348 168.106 99.424 168.171 99.515 168.21 C 99.607 168.249 99.709 168.269 99.821 168.269 C 99.911 168.269 99.989 168.255 100.052 168.228 C 100.118 168.201 100.171 168.167 100.214 168.125 C 100.256 168.082 100.286 168.035 100.304 167.986 C 100.324 167.935 100.333 167.885 100.333 167.836 C 100.333 167.731 100.303 167.644 100.242 167.575 C 100.181 167.506 100.098 167.472 99.992 167.472 Z M 104.42 167.274 C 104.411 167.288 104.388 167.33 104.353 167.402 C 104.316 167.471 104.267 167.56 104.21 167.667 C 104.154 167.772 104.09 167.893 104.018 168.03 C 103.945 168.168 103.869 168.311 103.791 168.457 C 103.713 168.605 103.636 168.755 103.557 168.907 C 103.477 169.06 103.4 169.205 103.328 169.341 C 103.256 169.477 103.189 169.604 103.131 169.719 C 103.071 169.833 103.021 169.927 102.982 170.002 C 102.968 170.024 102.953 170.046 102.936 170.067 C 102.919 170.087 102.902 170.105 102.883 170.122 C 102.864 170.138 102.845 170.153 102.825 170.162 C 102.805 170.173 102.789 170.177 102.773 170.174 C 102.756 170.174 102.737 170.172 102.718 170.168 C 102.698 170.163 102.68 170.161 102.664 170.161 C 102.657 170.163 102.65 170.167 102.646 170.174 C 102.64 170.181 102.634 170.188 102.627 170.192 C 102.621 170.197 102.613 170.2 102.604 170.2 C 102.595 170.2 102.583 170.194 102.569 170.182 C 102.56 170.173 102.548 170.167 102.534 170.162 C 102.521 170.159 102.508 170.156 102.497 170.153 C 102.485 170.151 102.474 170.147 102.465 170.143 C 102.456 170.138 102.45 170.129 102.447 170.116 C 102.439 170.08 102.422 170.029 102.398 169.966 C 102.373 169.901 102.338 169.809 102.292 169.688 C 102.247 169.568 102.191 169.414 102.124 169.228 C 102.057 169.039 101.979 168.806 101.889 168.528 C 101.85 168.405 101.806 168.279 101.758 168.147 C 101.71 168.015 101.665 167.891 101.622 167.777 C 101.579 167.662 101.539 167.562 101.507 167.476 C 101.473 167.392 101.452 167.334 101.441 167.306 C 101.417 167.253 101.409 167.216 101.416 167.197 C 101.422 167.179 101.445 167.171 101.48 167.177 C 101.505 167.18 101.533 167.186 101.564 167.191 C 101.596 167.197 101.627 167.204 101.657 167.211 C 101.688 167.218 101.716 167.225 101.74 167.232 C 101.765 167.239 101.784 167.244 101.798 167.247 C 101.807 167.251 101.815 167.251 101.819 167.247 C 101.823 167.242 101.827 167.236 101.832 167.231 C 101.835 167.224 101.84 167.218 101.847 167.212 C 101.854 167.207 101.864 167.205 101.881 167.205 C 101.897 167.205 101.908 167.203 101.914 167.199 C 101.921 167.195 101.927 167.191 101.933 167.188 C 101.938 167.185 101.945 167.181 101.955 167.178 C 101.963 167.174 101.978 167.171 101.999 167.169 C 102.043 167.169 102.073 167.173 102.088 167.181 C 102.103 167.189 102.114 167.206 102.122 167.232 C 102.125 167.239 102.137 167.285 102.159 167.37 C 102.182 167.454 102.212 167.561 102.251 167.69 C 102.288 167.82 102.333 167.966 102.382 168.126 C 102.43 168.286 102.482 168.444 102.536 168.601 C 102.59 168.758 102.646 168.906 102.701 169.045 C 102.759 169.182 102.814 169.295 102.867 169.382 C 102.891 169.337 102.926 169.271 102.972 169.184 C 103.018 169.098 103.071 168.998 103.131 168.886 C 103.189 168.774 103.253 168.653 103.323 168.524 C 103.395 168.394 103.465 168.263 103.534 168.133 C 103.604 168.003 103.672 167.876 103.735 167.753 C 103.801 167.63 103.86 167.52 103.915 167.422 C 103.969 167.324 104.013 167.242 104.048 167.178 C 104.084 167.113 104.107 167.073 104.117 167.06 C 104.129 167.043 104.137 167.035 104.144 167.031 C 104.149 167.027 104.157 167.026 104.166 167.029 C 104.174 167.031 104.182 167.036 104.19 167.043 C 104.198 167.05 104.208 167.055 104.22 167.06 C 104.244 167.072 104.269 167.086 104.296 167.103 C 104.323 167.119 104.347 167.136 104.369 167.156 C 104.391 167.174 104.408 167.194 104.42 167.215 C 104.43 167.236 104.43 167.256 104.42 167.274 Z M 107.223 168.778 C 107.223 168.803 107.224 168.833 107.227 168.868 C 107.229 168.903 107.23 168.944 107.23 168.987 C 107.23 169.043 107.221 169.114 107.203 169.198 C 107.184 169.28 107.155 169.368 107.114 169.458 C 107.073 169.55 107.019 169.641 106.95 169.732 C 106.881 169.823 106.797 169.905 106.696 169.978 C 106.596 170.05 106.478 170.11 106.341 170.155 C 106.205 170.2 106.05 170.224 105.877 170.224 C 105.721 170.224 105.561 170.197 105.399 170.144 C 105.237 170.092 105.089 170.01 104.956 169.899 C 104.822 169.788 104.712 169.646 104.626 169.475 C 104.54 169.302 104.498 169.096 104.498 168.858 C 104.498 168.708 104.52 168.56 104.565 168.415 C 104.607 168.271 104.665 168.134 104.738 168.005 C 104.81 167.876 104.895 167.757 104.995 167.648 C 105.094 167.54 105.198 167.446 105.307 167.369 C 105.418 167.289 105.531 167.227 105.648 167.183 C 105.766 167.138 105.88 167.117 105.992 167.117 C 106.184 167.117 106.343 167.144 106.468 167.197 C 106.593 167.252 106.693 167.318 106.768 167.397 C 106.842 167.476 106.894 167.562 106.924 167.651 C 106.955 167.742 106.97 167.824 106.97 167.896 C 106.97 167.966 106.951 168.047 106.913 168.136 C 106.874 168.227 106.811 168.312 106.723 168.393 C 106.637 168.474 106.524 168.542 106.384 168.597 C 106.243 168.651 106.071 168.679 105.868 168.679 C 105.76 168.679 105.663 168.666 105.578 168.639 C 105.492 168.612 105.416 168.577 105.35 168.537 C 105.283 168.496 105.227 168.452 105.18 168.403 C 105.135 168.355 105.096 168.311 105.065 168.269 C 105.017 168.413 104.993 168.583 104.993 168.778 C 104.993 168.911 105.015 169.03 105.059 169.137 C 105.102 169.243 105.161 169.334 105.238 169.409 C 105.314 169.483 105.406 169.541 105.512 169.581 C 105.618 169.621 105.734 169.641 105.86 169.641 C 106.019 169.641 106.157 169.617 106.275 169.569 C 106.395 169.521 106.499 169.46 106.586 169.388 C 106.675 169.316 106.752 169.237 106.816 169.151 C 106.882 169.066 106.938 168.987 106.985 168.915 C 107.033 168.845 107.074 168.786 107.11 168.739 C 107.145 168.692 107.18 168.669 107.215 168.672 C 107.231 168.672 107.238 168.684 107.238 168.708 C 107.238 168.719 107.237 168.731 107.235 168.742 C 107.232 168.754 107.228 168.766 107.223 168.778 M 106.031 167.472 C 105.983 167.472 105.921 167.48 105.847 167.497 C 105.771 167.515 105.691 167.546 105.608 167.59 C 105.526 167.636 105.444 167.695 105.362 167.772 C 105.279 167.847 105.208 167.944 105.147 168.061 C 105.184 168.044 105.217 168.03 105.245 168.019 C 105.272 168.008 105.291 168.002 105.302 168.002 C 105.308 168.002 105.315 168.007 105.326 168.015 C 105.387 168.106 105.463 168.171 105.554 168.21 C 105.645 168.249 105.747 168.269 105.86 168.269 C 105.95 168.269 106.027 168.255 106.091 168.228 C 106.157 168.201 106.21 168.167 106.252 168.125 C 106.295 168.082 106.325 168.035 106.343 167.986 C 106.362 167.935 106.372 167.885 106.372 167.836 C 106.372 167.731 106.341 167.644 106.28 167.575 C 106.219 167.506 106.137 167.472 106.031 167.472 Z M 108.541 165.371 C 108.541 165.404 108.538 165.468 108.532 165.564 C 108.528 165.661 108.522 165.776 108.514 165.911 C 108.506 166.045 108.497 166.193 108.487 166.353 C 108.478 166.513 108.468 166.673 108.458 166.833 C 108.448 166.994 108.439 167.15 108.431 167.299 C 108.422 167.449 108.417 167.58 108.414 167.692 C 108.409 167.76 108.406 167.835 108.404 167.917 C 108.403 167.998 108.402 168.086 108.402 168.18 C 108.402 168.305 108.403 168.433 108.404 168.568 C 108.406 168.703 108.407 168.836 108.411 168.966 C 108.413 169.098 108.417 169.223 108.421 169.344 C 108.424 169.465 108.428 169.573 108.431 169.669 C 108.434 169.765 108.435 169.845 108.436 169.91 C 108.437 169.974 108.438 170.014 108.438 170.03 C 108.438 170.063 108.432 170.089 108.421 170.107 C 108.409 170.124 108.394 170.135 108.377 170.141 C 108.36 170.147 108.342 170.148 108.323 170.144 C 108.305 170.141 108.289 170.136 108.275 170.129 C 108.26 170.123 108.247 170.114 108.239 170.103 C 108.23 170.094 108.222 170.087 108.216 170.082 C 108.21 170.079 108.206 170.078 108.203 170.08 C 108.198 170.081 108.195 170.091 108.193 170.108 C 108.185 170.169 108.169 170.215 108.147 170.244 C 108.125 170.275 108.101 170.296 108.076 170.306 C 108.051 170.317 108.027 170.32 108.007 170.315 C 107.986 170.309 107.972 170.302 107.966 170.291 C 107.962 170.279 107.954 170.272 107.941 170.27 C 107.929 170.267 107.917 170.265 107.904 170.264 C 107.891 170.262 107.878 170.259 107.867 170.253 C 107.855 170.247 107.847 170.235 107.844 170.216 C 107.823 170.137 107.81 170.037 107.804 169.913 C 107.799 169.791 107.798 169.652 107.798 169.497 C 107.798 169.363 107.799 169.22 107.801 169.066 C 107.803 168.911 107.804 168.752 107.804 168.591 C 107.804 168.497 107.804 168.405 107.804 168.312 C 107.804 168.219 107.802 168.125 107.798 168.029 L 107.798 167.808 C 107.798 167.619 107.803 167.428 107.812 167.238 C 107.823 167.047 107.836 166.864 107.852 166.688 C 107.868 166.512 107.885 166.348 107.904 166.194 C 107.922 166.04 107.937 165.902 107.951 165.782 C 107.965 165.663 107.975 165.566 107.983 165.491 C 107.991 165.416 107.994 165.37 107.99 165.35 C 107.988 165.335 107.99 165.323 107.997 165.316 C 108.004 165.308 108.013 165.305 108.024 165.302 C 108.036 165.302 108.049 165.3 108.063 165.299 C 108.075 165.298 108.087 165.296 108.098 165.29 C 108.116 165.282 108.132 165.279 108.144 165.282 C 108.155 165.286 108.165 165.291 108.173 165.298 C 108.181 165.305 108.188 165.312 108.194 165.32 C 108.201 165.329 108.211 165.332 108.225 165.332 C 108.24 165.33 108.253 165.326 108.263 165.32 C 108.271 165.314 108.279 165.308 108.286 165.302 C 108.292 165.297 108.3 165.293 108.306 165.287 C 108.312 165.282 108.321 165.281 108.331 165.283 C 108.353 165.287 108.373 165.291 108.393 165.292 C 108.413 165.294 108.422 165.291 108.422 165.283 C 108.428 165.265 108.436 165.256 108.446 165.258 C 108.456 165.258 108.469 165.265 108.485 165.277 C 108.5 165.289 108.515 165.301 108.526 165.313 C 108.536 165.326 108.541 165.345 108.541 165.371 Z M 111.876 168.577 C 111.876 168.823 111.835 169.044 111.754 169.241 C 111.674 169.438 111.565 169.605 111.427 169.742 C 111.288 169.88 111.127 169.987 110.945 170.061 C 110.763 170.137 110.57 170.174 110.367 170.174 C 110.283 170.174 110.19 170.166 110.09 170.149 C 109.99 170.131 109.889 170.102 109.787 170.061 C 109.688 170.022 109.59 169.969 109.495 169.904 C 109.4 169.839 109.317 169.758 109.242 169.662 C 109.167 169.566 109.109 169.454 109.066 169.325 C 109.022 169.196 109.001 169.047 109.004 168.879 C 109.004 168.687 109.03 168.512 109.083 168.354 C 109.136 168.196 109.204 168.055 109.287 167.93 C 109.371 167.804 109.465 167.696 109.571 167.605 C 109.676 167.513 109.782 167.436 109.888 167.374 C 109.994 167.313 110.096 167.266 110.193 167.236 C 110.29 167.206 110.374 167.188 110.446 167.183 C 110.483 167.18 110.499 167.184 110.495 167.193 C 110.491 167.203 110.481 167.214 110.465 167.226 C 110.449 167.237 110.436 167.248 110.425 167.26 C 110.412 167.273 110.417 167.279 110.438 167.281 C 110.456 167.286 110.471 167.291 110.484 167.295 C 110.495 167.3 110.507 167.306 110.521 167.313 L 110.553 167.281 C 110.571 167.269 110.589 167.264 110.605 167.264 C 110.624 167.264 110.638 167.265 110.651 167.269 C 110.665 167.273 110.675 167.274 110.683 167.274 C 110.691 167.274 110.696 167.267 110.7 167.254 C 110.704 167.228 110.715 167.213 110.729 167.209 C 110.744 167.206 110.777 167.205 110.83 167.205 C 110.862 167.205 110.91 167.212 110.973 167.229 C 111.039 167.245 111.11 167.273 111.188 167.313 C 111.266 167.353 111.345 167.406 111.427 167.473 C 111.507 167.541 111.58 167.625 111.648 167.726 C 111.715 167.828 111.77 167.949 111.811 168.089 C 111.855 168.23 111.876 168.392 111.876 168.577 M 110.446 167.548 C 110.354 167.597 110.263 167.664 110.173 167.749 C 110.083 167.833 110.002 167.929 109.929 168.04 C 109.856 168.149 109.797 168.272 109.752 168.408 C 109.709 168.544 109.686 168.687 109.686 168.837 C 109.686 168.998 109.703 169.145 109.735 169.275 C 109.768 169.407 109.816 169.519 109.879 169.611 C 109.943 169.704 110.02 169.775 110.111 169.825 C 110.202 169.876 110.305 169.901 110.421 169.901 C 110.525 169.901 110.627 169.875 110.729 169.824 C 110.83 169.772 110.921 169.694 111.001 169.592 C 111.079 169.488 111.143 169.361 111.192 169.21 C 111.241 169.057 111.266 168.88 111.266 168.679 C 111.266 168.476 111.236 168.305 111.175 168.167 C 111.114 168.028 111.045 167.916 110.97 167.831 C 110.895 167.745 110.823 167.684 110.754 167.648 C 110.685 167.612 110.643 167.594 110.627 167.594 C 110.592 167.594 110.563 167.594 110.543 167.594 C 110.523 167.594 110.491 167.579 110.446 167.548 Z M 113.312 167.109 C 113.308 167.126 113.303 167.159 113.3 167.208 C 113.298 167.257 113.294 167.318 113.288 167.391 C 113.402 167.363 113.518 167.34 113.638 167.324 C 113.757 167.307 113.877 167.299 114.002 167.299 C 114.139 167.299 114.276 167.313 114.413 167.339 C 114.551 167.367 114.678 167.413 114.797 167.477 C 114.89 167.528 114.969 167.606 115.034 167.713 C 115.098 167.821 115.151 167.936 115.194 168.061 C 115.218 168.133 115.242 168.213 115.265 168.302 C 115.289 168.39 115.301 168.486 115.301 168.591 C 115.301 168.679 115.289 168.773 115.264 168.868 C 115.238 168.965 115.193 169.064 115.13 169.167 C 115.067 169.267 114.982 169.371 114.874 169.477 C 114.765 169.584 114.626 169.692 114.458 169.8 C 114.293 169.904 114.147 169.984 114.02 170.039 C 113.892 170.094 113.782 170.132 113.693 170.153 C 113.603 170.174 113.534 170.184 113.485 170.183 C 113.436 170.182 113.407 170.179 113.399 170.174 C 113.376 170.16 113.353 170.135 113.329 170.096 C 113.306 170.058 113.272 170.016 113.229 169.97 C 113.216 169.956 113.204 169.942 113.194 169.927 C 113.183 169.912 113.171 169.894 113.158 169.873 C 113.151 170.098 113.144 170.317 113.139 170.532 C 113.136 170.748 113.135 170.949 113.135 171.137 C 113.135 171.254 113.135 171.364 113.138 171.465 C 113.141 171.568 113.145 171.659 113.15 171.741 C 113.15 171.772 113.152 171.801 113.156 171.829 C 113.159 171.859 113.161 171.886 113.159 171.909 C 113.159 171.932 113.153 171.952 113.143 171.965 C 113.132 171.98 113.111 171.986 113.082 171.986 C 113.031 171.986 112.991 171.997 112.963 172.02 C 112.935 172.042 112.902 172.076 112.866 172.123 C 112.845 172.144 112.822 172.16 112.799 172.171 C 112.775 172.181 112.75 172.181 112.724 172.171 C 112.699 172.16 112.674 172.137 112.65 172.104 C 112.625 172.07 112.602 172.018 112.581 171.951 C 112.572 171.923 112.565 171.886 112.559 171.84 C 112.552 171.795 112.546 171.738 112.542 171.669 C 112.539 171.6 112.536 171.516 112.535 171.42 C 112.534 171.322 112.533 171.207 112.533 171.073 L 112.548 169.858 C 112.554 169.551 112.567 169.253 112.587 168.964 C 112.609 168.673 112.634 168.401 112.663 168.146 C 112.597 168.169 112.536 168.186 112.481 168.198 C 112.426 168.21 112.391 168.212 112.377 168.204 C 112.352 168.195 112.335 168.185 112.327 168.173 C 112.32 168.162 112.314 168.151 112.31 168.139 C 112.308 168.13 112.305 168.121 112.302 168.112 C 112.297 168.103 112.286 168.098 112.267 168.096 C 112.249 168.093 112.232 168.086 112.219 168.075 C 112.206 168.063 112.198 168.051 112.194 168.04 C 112.19 168.029 112.192 168.018 112.198 168.007 C 112.204 167.997 112.218 167.99 112.239 167.987 C 112.259 167.985 112.261 167.978 112.247 167.967 C 112.234 167.957 112.222 167.944 112.21 167.926 C 112.198 167.908 112.195 167.887 112.2 167.859 C 112.205 167.833 112.238 167.801 112.299 167.766 C 112.33 167.742 112.385 167.713 112.466 167.677 C 112.544 167.64 112.639 167.6 112.751 167.556 C 112.78 167.372 112.809 167.223 112.839 167.108 C 112.87 166.992 112.896 166.921 112.92 166.895 C 112.934 166.883 112.943 166.873 112.949 166.863 C 112.953 166.854 112.959 166.847 112.964 166.839 C 112.97 166.833 112.976 166.827 112.984 166.821 C 112.992 166.817 113.007 166.812 113.028 166.808 C 113.046 166.805 113.062 166.808 113.076 166.818 C 113.088 166.828 113.1 166.839 113.113 166.854 C 113.125 166.871 113.138 166.885 113.15 166.9 C 113.163 166.913 113.179 166.922 113.197 166.924 C 113.234 166.928 113.264 166.945 113.286 166.975 C 113.31 167.003 113.318 167.048 113.312 167.109 M 114.072 167.794 C 113.954 167.794 113.827 167.806 113.693 167.829 C 113.558 167.852 113.409 167.891 113.246 167.945 L 113.173 169.469 C 113.197 169.475 113.224 169.48 113.253 169.48 C 113.282 169.483 113.316 169.483 113.353 169.483 C 113.44 169.483 113.54 169.473 113.655 169.452 C 113.77 169.43 113.887 169.397 114.006 169.355 C 114.124 169.312 114.242 169.259 114.358 169.198 C 114.475 169.135 114.577 169.062 114.669 168.98 C 114.76 168.898 114.833 168.807 114.889 168.708 C 114.943 168.607 114.972 168.497 114.976 168.376 C 114.979 168.306 114.96 168.237 114.923 168.168 C 114.884 168.1 114.827 168.036 114.752 167.979 C 114.677 167.923 114.584 167.878 114.47 167.845 C 114.356 167.81 114.223 167.794 114.072 167.794 Z M 119.759 169.821 C 119.767 169.839 119.773 169.853 119.778 169.865 C 119.781 169.877 119.782 169.89 119.782 169.901 C 119.782 169.922 119.773 169.934 119.754 169.937 C 119.734 169.942 119.713 169.945 119.692 169.949 C 119.688 169.953 119.682 169.964 119.676 169.984 C 119.671 170.004 119.664 170.025 119.654 170.049 C 119.645 170.071 119.631 170.092 119.611 170.111 C 119.591 170.13 119.565 170.14 119.529 170.14 C 119.419 170.133 119.332 170.111 119.267 170.076 C 119.204 170.039 119.158 169.988 119.126 169.925 C 119.094 169.862 119.074 169.787 119.066 169.699 C 119.059 169.611 119.055 169.513 119.055 169.406 C 119.055 169.279 119.061 169.146 119.072 169.008 C 119.084 168.87 119.098 168.737 119.114 168.605 C 119.13 168.474 119.144 168.349 119.156 168.234 C 119.167 168.118 119.173 168.019 119.173 167.938 C 119.173 167.819 119.162 167.726 119.139 167.66 C 119.117 167.595 119.085 167.563 119.046 167.563 C 119.028 167.563 118.981 167.612 118.905 167.709 C 118.828 167.805 118.735 167.952 118.629 168.148 C 118.522 168.346 118.407 168.593 118.284 168.891 C 118.161 169.187 118.045 169.536 117.934 169.936 C 117.929 169.952 117.926 169.969 117.926 169.988 C 117.926 170.007 117.925 170.025 117.923 170.039 C 117.92 170.055 117.913 170.067 117.904 170.079 C 117.895 170.088 117.881 170.093 117.862 170.093 C 117.826 170.093 117.797 170.087 117.776 170.076 C 117.754 170.062 117.735 170.048 117.72 170.031 C 117.704 170.017 117.689 170.003 117.676 169.99 C 117.664 169.977 117.647 169.97 117.626 169.97 C 117.618 169.97 117.611 169.975 117.605 169.986 C 117.599 169.995 117.593 170.005 117.585 170.018 C 117.577 170.031 117.568 170.042 117.558 170.051 C 117.547 170.061 117.533 170.067 117.514 170.067 C 117.498 170.067 117.481 170.063 117.463 170.058 C 117.444 170.051 117.425 170.036 117.407 170.01 C 117.388 169.987 117.373 169.951 117.362 169.903 C 117.35 169.855 117.343 169.79 117.343 169.708 L 117.343 169.55 C 117.343 169.517 117.346 169.466 117.355 169.397 C 117.363 169.327 117.372 169.248 117.382 169.157 C 117.391 169.065 117.401 168.966 117.412 168.86 C 117.425 168.753 117.436 168.645 117.444 168.536 C 117.453 168.425 117.461 168.317 117.468 168.211 C 117.475 168.106 117.479 168.011 117.479 167.924 C 117.479 167.659 117.441 167.527 117.367 167.527 C 117.349 167.527 117.328 167.533 117.304 167.545 C 117.281 167.557 117.252 167.581 117.22 167.617 C 117.186 167.653 117.148 167.704 117.105 167.772 C 117.061 167.838 117.012 167.927 116.958 168.038 C 116.904 168.148 116.842 168.284 116.772 168.445 C 116.703 168.606 116.625 168.799 116.54 169.024 C 116.521 169.072 116.501 169.145 116.479 169.24 C 116.456 169.335 116.436 169.43 116.417 169.528 C 116.399 169.627 116.384 169.718 116.372 169.801 C 116.36 169.884 116.353 169.939 116.353 169.965 C 116.353 169.972 116.34 169.983 116.313 169.997 C 116.284 170.013 116.251 170.027 116.214 170.04 C 116.179 170.055 116.141 170.067 116.103 170.079 C 116.065 170.088 116.035 170.093 116.014 170.093 C 115.969 170.093 115.934 170.081 115.91 170.061 C 115.887 170.039 115.868 169.997 115.856 169.937 C 115.845 169.877 115.839 169.795 115.838 169.692 C 115.835 169.588 115.835 169.454 115.835 169.291 C 115.835 169.249 115.837 169.165 115.841 169.04 C 115.844 168.916 115.852 168.774 115.863 168.612 C 115.873 168.451 115.886 168.282 115.902 168.105 C 115.917 167.929 115.937 167.766 115.958 167.618 C 115.979 167.47 116.004 167.349 116.034 167.254 C 116.062 167.157 116.095 167.109 116.132 167.109 C 116.151 167.109 116.169 167.115 116.185 167.127 C 116.2 167.139 116.214 167.151 116.226 167.165 C 116.24 167.177 116.253 167.188 116.265 167.2 C 116.276 167.212 116.289 167.218 116.302 167.218 C 116.313 167.218 116.324 167.214 116.336 167.205 C 116.348 167.195 116.358 167.183 116.369 167.171 C 116.377 167.158 116.386 167.147 116.395 167.138 C 116.404 167.129 116.412 167.124 116.417 167.124 C 116.426 167.124 116.438 167.136 116.453 167.159 C 116.469 167.181 116.484 167.209 116.499 167.242 C 116.513 167.273 116.526 167.306 116.537 167.339 C 116.549 167.374 116.556 167.4 116.556 167.418 C 116.556 167.465 116.551 167.532 116.542 167.618 C 116.533 167.705 116.523 167.801 116.51 167.905 C 116.498 168.009 116.487 168.115 116.479 168.222 C 116.469 168.33 116.465 168.429 116.465 168.52 L 116.465 168.536 C 116.499 168.434 116.54 168.33 116.586 168.224 C 116.633 168.118 116.683 168.014 116.739 167.912 C 116.793 167.81 116.852 167.713 116.914 167.621 C 116.976 167.53 117.041 167.451 117.11 167.383 C 117.179 167.316 117.248 167.262 117.319 167.221 C 117.391 167.181 117.464 167.162 117.538 167.162 C 117.627 167.162 117.704 167.175 117.769 167.202 C 117.834 167.229 117.887 167.266 117.926 167.315 C 117.965 167.362 117.994 167.418 118.012 167.481 C 118.031 167.542 118.041 167.609 118.041 167.679 C 118.041 167.739 118.036 167.81 118.027 167.89 C 118.018 167.968 118.007 168.057 117.998 168.155 C 117.987 168.252 117.977 168.358 117.966 168.474 C 117.957 168.59 117.952 168.716 117.949 168.851 C 117.983 168.767 118.026 168.665 118.075 168.548 C 118.124 168.429 118.177 168.307 118.237 168.18 C 118.297 168.054 118.36 167.929 118.426 167.804 C 118.494 167.68 118.562 167.57 118.631 167.472 C 118.699 167.372 118.769 167.293 118.838 167.232 C 118.909 167.171 118.975 167.141 119.038 167.141 C 119.057 167.141 119.098 167.147 119.163 167.157 C 119.228 167.168 119.297 167.182 119.369 167.202 C 119.442 167.221 119.51 167.247 119.574 167.277 C 119.636 167.306 119.679 167.339 119.7 167.376 C 119.721 167.416 119.741 167.472 119.757 167.544 C 119.774 167.615 119.782 167.71 119.782 167.829 C 119.782 167.935 119.774 168.061 119.757 168.207 C 119.741 168.353 119.711 168.529 119.668 168.734 C 119.654 168.802 119.646 168.868 119.643 168.933 C 119.638 168.995 119.635 169.057 119.635 169.118 C 119.635 169.207 119.641 169.29 119.651 169.367 C 119.66 169.445 119.672 169.514 119.685 169.575 C 119.697 169.635 119.71 169.687 119.724 169.731 C 119.737 169.774 119.749 169.804 119.759 169.821 Z M 123.003 168.778 C 123.003 168.803 123.004 168.833 123.006 168.868 C 123.008 168.903 123.01 168.944 123.01 168.987 C 123.01 169.043 123 169.114 122.983 169.198 C 122.963 169.28 122.934 169.368 122.894 169.458 C 122.853 169.55 122.798 169.641 122.729 169.732 C 122.661 169.823 122.576 169.905 122.476 169.978 C 122.376 170.05 122.257 170.11 122.121 170.155 C 121.985 170.2 121.83 170.224 121.656 170.224 C 121.501 170.224 121.341 170.197 121.179 170.144 C 121.016 170.092 120.869 170.01 120.736 169.899 C 120.602 169.788 120.492 169.646 120.406 169.475 C 120.321 169.302 120.278 169.096 120.278 168.858 C 120.278 168.708 120.299 168.56 120.344 168.415 C 120.387 168.271 120.444 168.134 120.518 168.005 C 120.589 167.876 120.675 167.757 120.775 167.648 C 120.873 167.54 120.978 167.446 121.088 167.369 C 121.197 167.289 121.311 167.227 121.428 167.183 C 121.545 167.138 121.66 167.117 121.772 167.117 C 121.964 167.117 122.123 167.144 122.248 167.197 C 122.373 167.252 122.473 167.318 122.547 167.397 C 122.621 167.476 122.674 167.562 122.704 167.651 C 122.735 167.742 122.75 167.824 122.75 167.896 C 122.75 167.966 122.731 168.047 122.692 168.136 C 122.654 168.227 122.591 168.312 122.503 168.393 C 122.417 168.474 122.303 168.542 122.164 168.597 C 122.022 168.651 121.851 168.679 121.648 168.679 C 121.54 168.679 121.443 168.666 121.358 168.639 C 121.272 168.612 121.195 168.577 121.13 168.537 C 121.063 168.496 121.007 168.452 120.961 168.403 C 120.914 168.355 120.876 168.311 120.844 168.269 C 120.796 168.413 120.773 168.583 120.773 168.778 C 120.773 168.911 120.795 169.03 120.839 169.137 C 120.882 169.243 120.941 169.334 121.018 169.409 C 121.095 169.483 121.186 169.541 121.292 169.581 C 121.398 169.621 121.513 169.641 121.639 169.641 C 121.798 169.641 121.937 169.617 122.055 169.569 C 122.175 169.521 122.279 169.46 122.366 169.388 C 122.455 169.316 122.532 169.237 122.596 169.151 C 122.661 169.066 122.718 168.987 122.765 168.915 C 122.812 168.845 122.854 168.786 122.89 168.739 C 122.925 168.692 122.96 168.669 122.995 168.672 C 123.01 168.672 123.019 168.684 123.019 168.708 C 123.019 168.719 123.017 168.731 123.015 168.742 C 123.012 168.754 123.008 168.766 123.003 168.778 M 121.81 167.472 C 121.763 167.472 121.701 167.48 121.627 167.497 C 121.55 167.515 121.471 167.546 121.388 167.59 C 121.305 167.636 121.224 167.695 121.142 167.772 C 121.059 167.847 120.987 167.944 120.926 168.061 C 120.964 168.044 120.996 168.03 121.024 168.019 C 121.052 168.008 121.071 168.002 121.082 168.002 C 121.088 168.002 121.096 168.007 121.106 168.015 C 121.167 168.106 121.243 168.171 121.334 168.21 C 121.425 168.249 121.527 168.269 121.639 168.269 C 121.729 168.269 121.807 168.255 121.871 168.228 C 121.936 168.201 121.989 168.167 122.032 168.125 C 122.075 168.082 122.104 168.035 122.123 167.986 C 122.142 167.935 122.152 167.885 122.152 167.836 C 122.152 167.731 122.121 167.644 122.06 167.575 C 122 167.506 121.916 167.472 121.81 167.472 Z M 125.96 169.907 C 125.96 169.935 125.948 169.966 125.927 170 C 125.905 170.034 125.872 170.051 125.83 170.051 C 125.806 170.051 125.787 170.046 125.773 170.035 C 125.761 170.023 125.749 170.017 125.735 170.017 C 125.716 170.017 125.698 170.023 125.681 170.035 C 125.663 170.046 125.635 170.051 125.596 170.051 C 125.543 170.051 125.497 170.034 125.46 170 C 125.421 169.966 125.39 169.923 125.366 169.871 C 125.343 169.818 125.325 169.762 125.313 169.699 C 125.301 169.637 125.296 169.58 125.296 169.525 C 125.296 169.42 125.3 169.3 125.309 169.167 C 125.318 169.031 125.329 168.892 125.342 168.752 C 125.353 168.609 125.362 168.468 125.371 168.329 C 125.382 168.188 125.386 168.057 125.386 167.938 C 125.386 167.779 125.375 167.655 125.351 167.566 C 125.326 167.477 125.284 167.433 125.224 167.433 C 125.166 167.44 125.106 167.485 125.046 167.566 C 124.984 167.647 124.923 167.753 124.86 167.881 C 124.796 168.008 124.735 168.151 124.674 168.312 C 124.612 168.473 124.554 168.636 124.496 168.804 C 124.44 168.971 124.387 169.134 124.337 169.292 C 124.287 169.45 124.242 169.59 124.202 169.714 C 124.163 169.839 124.128 169.939 124.099 170.016 C 124.07 170.091 124.05 170.129 124.04 170.129 C 124.019 170.129 124.003 170.125 123.993 170.117 C 123.981 170.108 123.971 170.099 123.962 170.09 C 123.953 170.081 123.942 170.073 123.928 170.065 C 123.916 170.056 123.896 170.051 123.87 170.051 C 123.846 170.051 123.83 170.054 123.822 170.059 C 123.814 170.064 123.805 170.07 123.794 170.077 C 123.783 170.084 123.77 170.09 123.755 170.093 C 123.739 170.098 123.711 170.101 123.672 170.101 C 123.625 170.101 123.578 170.09 123.532 170.07 C 123.485 170.049 123.462 170.016 123.462 169.97 C 123.462 169.942 123.468 169.884 123.477 169.797 C 123.488 169.709 123.5 169.602 123.515 169.475 C 123.529 169.347 123.545 169.204 123.562 169.046 C 123.58 168.888 123.595 168.725 123.61 168.557 C 123.623 168.388 123.637 168.219 123.648 168.05 C 123.659 167.882 123.663 167.721 123.663 167.569 C 123.663 167.494 123.663 167.424 123.66 167.36 C 123.657 167.296 123.655 167.234 123.655 167.177 C 123.655 167.162 123.663 167.156 123.679 167.156 C 123.711 167.156 123.736 167.16 123.753 167.171 C 123.77 167.181 123.782 167.193 123.79 167.205 C 123.798 167.216 123.802 167.227 123.804 167.238 C 123.805 167.248 123.807 167.254 123.81 167.254 C 123.818 167.254 123.827 167.249 123.838 167.242 C 123.848 167.233 123.859 167.224 123.871 167.215 C 123.883 167.206 123.895 167.197 123.905 167.188 C 123.916 167.18 123.924 167.177 123.932 167.177 L 123.973 167.177 C 124.012 167.177 124.04 167.171 124.055 167.16 C 124.071 167.15 124.083 167.138 124.089 167.126 C 124.095 167.113 124.1 167.101 124.103 167.09 C 124.106 167.08 124.114 167.074 124.127 167.074 C 124.134 167.074 124.146 167.08 124.16 167.09 C 124.175 167.101 124.189 167.118 124.204 167.144 C 124.218 167.168 124.231 167.2 124.241 167.239 C 124.252 167.279 124.258 167.328 124.258 167.383 C 124.258 167.458 124.255 167.553 124.248 167.668 C 124.241 167.783 124.234 167.905 124.224 168.035 C 124.215 168.165 124.206 168.296 124.197 168.427 C 124.189 168.56 124.185 168.681 124.182 168.788 C 124.211 168.688 124.246 168.576 124.287 168.453 C 124.328 168.33 124.376 168.205 124.43 168.079 C 124.484 167.952 124.543 167.829 124.606 167.709 C 124.669 167.588 124.738 167.48 124.812 167.387 C 124.885 167.294 124.963 167.218 125.046 167.16 C 125.128 167.103 125.213 167.074 125.302 167.074 C 125.446 167.074 125.563 167.098 125.654 167.145 C 125.745 167.191 125.817 167.257 125.87 167.338 C 125.921 167.42 125.958 167.516 125.978 167.626 C 125.998 167.736 126.009 167.854 126.009 167.979 C 126.009 168.087 126.003 168.201 125.992 168.32 C 125.981 168.437 125.97 168.555 125.958 168.673 C 125.947 168.792 125.936 168.909 125.927 169.024 C 125.917 169.137 125.912 169.244 125.912 169.346 C 125.912 169.469 125.92 169.581 125.936 169.682 C 125.952 169.781 125.96 169.856 125.96 169.907 Z M 127.794 165.93 C 127.794 165.945 127.792 165.981 127.786 166.041 C 127.781 166.1 127.773 166.179 127.764 166.277 C 127.755 166.375 127.744 166.489 127.73 166.619 C 127.716 166.749 127.704 166.889 127.692 167.039 C 127.857 167.02 128.014 167.006 128.164 166.996 C 128.313 166.985 128.439 166.98 128.543 166.98 C 128.576 166.98 128.607 166.986 128.634 166.997 C 128.66 167.009 128.681 167.022 128.698 167.037 C 128.715 167.052 128.729 167.069 128.74 167.087 C 128.751 167.105 128.757 167.119 128.761 167.13 C 128.761 167.142 128.762 167.153 128.764 167.165 C 128.766 167.174 128.767 167.186 128.767 167.197 C 128.767 167.244 128.744 167.292 128.698 167.338 C 128.652 167.384 128.583 167.413 128.49 167.425 L 127.647 167.506 C 127.634 167.675 127.622 167.849 127.611 168.026 C 127.601 168.204 127.59 168.381 127.582 168.558 C 127.573 168.734 127.565 168.909 127.56 169.079 C 127.555 169.25 127.553 169.412 127.553 169.564 C 127.553 169.662 127.555 169.741 127.56 169.803 C 127.565 169.863 127.568 169.904 127.568 169.922 C 127.568 169.962 127.56 170 127.543 170.039 C 127.526 170.079 127.505 170.114 127.484 170.144 C 127.461 170.176 127.437 170.202 127.411 170.222 C 127.386 170.241 127.366 170.252 127.35 170.252 C 127.255 170.252 127.18 170.226 127.125 170.173 C 127.069 170.12 127.028 170.049 127 169.96 C 126.972 169.871 126.954 169.769 126.946 169.655 C 126.938 169.54 126.934 169.421 126.934 169.296 C 126.934 169.004 126.943 168.71 126.961 168.417 C 126.98 168.124 127.007 167.84 127.04 167.569 L 126.546 167.621 C 126.538 167.621 126.53 167.623 126.522 167.626 C 126.515 167.628 126.506 167.629 126.495 167.629 C 126.444 167.629 126.404 167.618 126.373 167.597 C 126.343 167.576 126.319 167.552 126.304 167.524 C 126.288 167.496 126.278 167.467 126.275 167.437 C 126.271 167.408 126.269 167.386 126.269 167.37 C 126.269 167.337 126.274 167.307 126.286 167.278 C 126.295 167.251 126.315 167.233 126.344 167.226 C 126.4 167.207 126.497 167.186 126.636 167.165 C 126.774 167.141 126.93 167.118 127.105 167.095 C 127.134 166.906 127.164 166.732 127.195 166.574 C 127.225 166.416 127.254 166.279 127.283 166.164 C 127.312 166.048 127.338 165.957 127.363 165.892 C 127.389 165.829 127.411 165.797 127.429 165.797 C 127.435 165.797 127.442 165.797 127.45 165.8 C 127.457 165.802 127.464 165.803 127.468 165.803 C 127.485 165.803 127.498 165.796 127.507 165.78 C 127.516 165.765 127.533 165.758 127.56 165.758 C 127.583 165.758 127.609 165.764 127.637 165.777 C 127.666 165.79 127.691 165.806 127.713 165.824 C 127.736 165.843 127.755 165.862 127.77 165.882 C 127.786 165.903 127.794 165.918 127.794 165.93 Z");
    			set_style(path0, "white-space", "pre");
    			attr_dev(path0, "class", "svelte-10j6a2e");
    			add_location(path0, file$6, 0, 135, 135);
    			attr_dev(path1, "d", "M 74.046 146.354 C 74.584 146.3 75.144 146.252 75.726 146.211 C 76.306 146.17 76.851 146.15 77.361 146.15 C 77.514 146.144 77.691 146.138 77.891 146.13 C 78.061 146.123 78.258 146.117 78.486 146.114 C 78.713 146.111 78.962 146.109 79.231 146.109 C 79.516 146.109 79.818 146.113 80.138 146.12 C 80.457 146.126 80.778 146.137 81.101 146.15 C 81.133 145.74 81.164 145.318 81.194 144.881 C 81.225 144.444 81.254 144.021 81.281 143.615 C 81.307 143.209 81.331 142.834 81.35 142.49 C 81.369 142.144 81.387 141.856 81.402 141.624 L 81.402 140.927 C 81.402 140.736 81.402 140.547 81.402 140.36 C 81.402 140.172 81.41 140.02 81.426 139.903 C 81.48 139.678 81.592 139.566 81.76 139.566 C 81.861 139.566 81.938 139.576 81.992 139.596 C 82.046 139.617 82.142 139.654 82.281 139.709 C 82.35 139.729 82.424 139.757 82.505 139.79 C 82.586 139.824 82.666 139.86 82.742 139.898 C 82.819 139.936 82.888 139.973 82.95 140.011 C 83.012 140.048 83.059 140.081 83.088 140.108 C 83.119 140.136 83.157 140.182 83.205 140.246 C 83.251 140.31 83.297 140.381 83.344 140.457 C 83.389 140.532 83.428 140.608 83.458 140.686 C 83.489 140.765 83.5 140.832 83.492 140.887 C 83.486 140.941 83.466 141.14 83.434 141.486 C 83.405 141.831 83.366 142.285 83.32 142.848 C 83.274 143.411 83.224 144.065 83.169 144.808 C 83.116 145.552 83.066 146.348 83.019 147.195 C 82.951 148.56 82.916 149.693 82.916 150.594 C 82.916 151.27 82.93 151.817 82.957 152.233 C 82.982 152.649 83.018 152.943 83.065 153.114 C 83.135 153.4 83.185 153.605 83.215 153.728 C 83.246 153.851 83.243 153.932 83.205 153.973 C 83.189 153.988 83.165 154.001 83.134 154.014 C 83.058 154.042 82.931 154.069 82.753 154.097 C 82.724 154.171 82.692 154.231 82.66 154.276 C 82.631 154.32 82.6 154.356 82.57 154.383 C 82.538 154.411 82.507 154.435 82.476 154.455 C 82.399 154.476 82.326 154.496 82.257 154.516 C 82.187 154.537 82.133 154.53 82.095 154.497 C 82.073 154.49 82.053 154.479 82.038 154.465 C 82.007 154.451 81.98 154.414 81.956 154.353 C 81.88 154.379 81.811 154.379 81.748 154.353 C 81.718 154.339 81.691 154.325 81.668 154.313 C 81.606 154.264 81.519 154.179 81.402 154.056 C 81.287 153.933 81.21 153.766 81.171 153.555 C 81.157 153.452 81.132 153.34 81.096 153.221 C 81.062 153.102 81.026 152.979 80.991 152.854 C 80.957 152.726 80.924 152.603 80.889 152.484 C 80.854 152.365 80.828 152.253 80.813 152.151 C 80.79 152.056 80.781 151.855 80.784 151.547 C 80.788 151.24 80.8 150.881 80.819 150.471 C 80.839 150.061 80.863 149.625 80.894 149.161 C 80.925 148.696 80.956 148.259 80.986 147.849 C 80.986 147.795 80.986 147.737 80.986 147.676 C 80.986 147.614 80.995 147.546 81.01 147.47 C 80.664 147.458 80.322 147.451 79.988 147.451 C 79.653 147.451 79.331 147.451 79.023 147.451 C 78.638 147.451 78.288 147.453 77.972 147.456 C 77.658 147.459 77.381 147.464 77.141 147.47 C 76.864 147.477 76.614 147.485 76.389 147.491 C 75.574 147.491 74.785 147.512 74.022 147.553 C 74.015 147.655 74.008 147.743 74.005 147.82 C 74 147.894 73.998 147.959 73.998 148.015 L 73.998 148.168 C 73.984 148.837 73.968 149.478 73.953 150.093 C 73.937 150.707 73.926 151.256 73.918 151.741 C 73.911 152.226 73.906 152.629 73.901 152.949 C 73.897 153.271 73.9 153.473 73.907 153.555 C 73.907 153.623 73.903 153.694 73.895 153.769 C 73.888 153.837 73.874 153.918 73.855 154.01 C 73.836 154.101 73.807 154.202 73.768 154.313 C 73.691 154.318 73.617 154.342 73.549 154.383 C 73.518 154.404 73.487 154.421 73.456 154.435 C 73.387 154.476 73.323 154.522 73.266 154.573 C 73.208 154.624 73.156 154.633 73.11 154.599 C 73.048 154.558 72.973 154.53 72.885 154.516 C 72.796 154.503 72.686 154.497 72.555 154.497 C 72.494 154.497 72.428 154.479 72.36 154.444 C 72.29 154.41 72.224 154.371 72.162 154.327 C 72.102 154.282 72.048 154.233 72.001 154.179 C 71.956 154.124 71.928 154.077 71.92 154.035 C 71.905 153.994 71.886 153.934 71.863 153.856 C 71.84 153.778 71.818 153.696 71.799 153.61 C 71.78 153.525 71.762 153.443 71.747 153.364 C 71.732 153.286 71.721 153.23 71.713 153.197 C 71.705 153.162 71.705 152.99 71.713 152.684 C 71.721 152.377 71.736 151.972 71.758 151.471 C 71.782 150.968 71.809 150.39 71.84 149.739 C 71.87 149.087 71.904 148.4 71.942 147.676 C 71.65 147.703 71.405 147.725 71.204 147.743 C 71.003 147.759 70.88 147.775 70.834 147.788 C 70.75 147.802 70.683 147.817 70.633 147.835 C 70.583 147.852 70.54 147.867 70.505 147.881 C 70.471 147.894 70.438 147.903 70.407 147.906 C 70.376 147.91 70.346 147.904 70.315 147.891 C 70.269 147.891 70.225 147.864 70.182 147.814 C 70.139 147.764 70.111 147.703 70.096 147.636 C 70.011 147.621 69.956 147.595 69.928 147.558 C 69.901 147.521 69.88 147.491 69.864 147.47 C 69.864 147.417 69.893 147.378 69.951 147.354 C 70.009 147.33 70.099 147.263 70.222 147.154 C 70.276 147.105 70.355 147.059 70.459 147.015 C 70.563 146.971 70.673 146.929 70.788 146.888 C 70.903 146.847 71.017 146.811 71.129 146.78 C 71.241 146.749 71.34 146.727 71.423 146.712 L 71.99 146.632 C 72.036 145.963 72.082 145.351 72.128 144.798 C 72.175 144.245 72.217 143.734 72.255 143.263 C 72.294 142.791 72.326 142.352 72.353 141.946 C 72.38 141.539 72.394 141.145 72.394 140.764 C 72.394 140.654 72.39 140.552 72.382 140.457 C 72.374 140.361 72.37 140.258 72.37 140.15 C 72.37 140.067 72.396 139.997 72.446 139.938 C 72.496 139.881 72.559 139.845 72.637 139.832 L 72.775 139.832 C 72.86 139.832 73.018 139.843 73.248 139.863 C 73.279 139.794 73.313 139.75 73.352 139.729 C 73.375 139.715 73.395 139.709 73.411 139.709 C 73.471 139.709 73.524 139.721 73.566 139.745 C 73.609 139.769 73.638 139.79 73.653 139.811 C 73.653 139.825 73.656 139.839 73.664 139.852 C 73.672 139.873 73.684 139.904 73.699 139.945 C 73.76 139.958 73.807 139.97 73.838 139.985 C 73.868 139.999 73.895 140.013 73.918 140.025 C 73.941 140.046 73.961 140.06 73.976 140.067 L 74.01 140.129 C 74.034 140.17 74.057 140.248 74.08 140.364 C 74.134 140.467 74.169 140.538 74.184 140.58 C 74.192 140.607 74.195 140.624 74.195 140.63 C 74.195 140.643 74.199 140.661 74.207 140.682 C 74.207 140.695 74.208 140.709 74.213 140.722 C 74.216 140.736 74.218 140.75 74.218 140.764 L 74.046 146.354 Z");
    			set_style(path1, "white-space", "pre");
    			attr_dev(path1, "class", "svelte-10j6a2e");
    			add_location(path1, file$6, 0, 69003, 69003);
    			attr_dev(path2, "d", "M 114.053 141.585 C 114.053 141.591 114.051 141.696 114.046 141.901 C 114.043 142.107 114.039 142.38 114.034 142.721 C 114.031 143.062 114.027 143.458 114.022 143.908 C 114.018 144.36 114.013 144.836 114.006 145.338 C 113.998 145.839 113.992 146.352 113.989 146.879 C 113.986 147.404 113.982 147.912 113.977 148.4 C 113.974 148.888 113.969 149.343 113.965 149.765 C 113.961 150.189 113.96 150.551 113.96 150.852 L 113.96 151.465 C 114.068 151.48 114.174 151.486 114.277 151.486 C 114.381 151.486 114.487 151.486 114.595 151.486 C 114.919 151.486 115.305 151.459 115.756 151.404 C 116.206 151.35 116.691 151.232 117.211 151.05 C 117.731 150.87 118.274 150.607 118.84 150.263 C 119.405 149.919 119.961 149.453 120.509 148.865 C 121.163 148.169 121.631 147.473 121.911 146.775 C 122.192 146.079 122.333 145.383 122.333 144.687 C 122.333 144.1 122.264 143.591 122.125 143.16 C 121.987 142.731 121.793 142.368 121.543 142.07 C 121.292 141.773 120.995 141.533 120.653 141.348 C 120.31 141.164 119.932 141.021 119.52 140.918 C 119.11 140.817 118.67 140.748 118.204 140.715 C 117.737 140.68 117.262 140.662 116.778 140.662 C 116.431 140.662 116.03 140.7 115.577 140.776 C 115.123 140.851 114.654 140.946 114.173 141.062 C 113.692 141.178 113.216 141.3 112.747 141.43 C 112.277 141.56 111.851 141.683 111.471 141.799 C 111.09 141.915 110.772 142.011 110.518 142.086 C 110.263 142.161 110.109 142.199 110.055 142.199 C 109.978 142.13 109.913 142.065 109.86 142.004 C 109.813 141.957 109.77 141.912 109.733 141.871 C 109.694 141.83 109.676 141.806 109.676 141.799 C 109.676 141.785 109.686 141.767 109.709 141.748 C 109.725 141.735 109.752 141.717 109.79 141.697 C 109.828 141.676 109.886 141.659 109.964 141.646 C 109.941 141.605 109.927 141.578 109.923 141.564 C 109.919 141.55 109.917 141.536 109.917 141.523 C 109.917 141.502 109.921 141.482 109.929 141.462 C 109.936 141.441 109.971 141.421 110.033 141.4 C 109.917 141.353 109.836 141.31 109.79 141.272 C 109.744 141.234 109.715 141.205 109.704 141.184 C 109.693 141.163 109.69 141.151 109.697 141.144 C 109.705 141.137 109.709 141.137 109.709 141.144 C 109.709 141.123 109.725 141.109 109.756 141.102 C 109.786 141.095 109.809 141.075 109.826 141.041 C 109.826 141.033 109.848 140.99 109.895 140.907 C 109.941 140.826 110.039 140.731 110.189 140.621 C 110.339 140.512 110.552 140.399 110.829 140.283 C 111.106 140.167 111.48 140.065 111.949 139.976 C 112.111 139.942 112.331 139.896 112.608 139.838 C 112.885 139.78 113.207 139.724 113.573 139.669 C 113.939 139.615 114.337 139.567 114.768 139.526 C 115.199 139.485 115.649 139.465 116.12 139.465 C 117.405 139.465 118.545 139.634 119.539 139.971 C 120.531 140.309 121.365 140.761 122.039 141.329 C 122.713 141.895 123.223 142.55 123.568 143.294 C 123.916 144.039 124.088 144.817 124.088 145.629 C 124.088 146.106 124.016 146.598 123.869 147.104 C 123.722 147.609 123.513 148.107 123.24 148.599 C 122.967 149.09 122.637 149.564 122.252 150.022 C 121.867 150.479 121.435 150.898 120.958 151.277 C 120.482 151.655 119.968 151.988 119.417 152.275 C 118.866 152.561 118.287 152.78 117.679 152.931 C 117.07 153.081 116.518 153.185 116.021 153.242 C 115.525 153.301 115.068 153.33 114.653 153.33 C 114.099 153.33 113.648 153.301 113.301 153.242 C 112.955 153.185 112.687 153.12 112.498 153.048 C 112.31 152.977 112.184 152.907 112.119 152.838 C 112.051 152.771 112.018 152.726 112.018 152.705 C 111.972 152.664 111.949 152.599 111.949 152.512 C 111.957 152.347 111.977 151.876 112.009 151.098 C 112.023 150.77 112.04 150.357 112.059 149.859 C 112.078 149.36 112.101 148.758 112.128 148.051 C 112.156 147.344 112.19 146.517 112.233 145.568 C 112.275 144.619 112.323 143.53 112.377 142.3 C 112.377 142.158 112.422 142.059 112.511 142.004 C 112.599 141.949 112.709 141.908 112.84 141.882 C 112.97 141.853 113.11 141.828 113.26 141.805 C 113.411 141.781 113.545 141.728 113.659 141.646 C 113.705 141.611 113.757 141.582 113.815 141.557 C 113.873 141.534 113.921 141.523 113.96 141.523 C 114.022 141.523 114.053 141.544 114.053 141.585 Z");
    			set_style(path2, "white-space", "pre");
    			attr_dev(path2, "class", "svelte-10j6a2e");
    			add_location(path2, file$6, 0, 75129, 75129);
    			attr_dev(path3, "d", "M 108.762 146.506 C 108.762 146.532 108.698 146.675 108.568 146.935 C 108.434 147.195 108.255 147.538 108.033 147.962 C 107.81 148.39 107.546 148.887 107.241 149.454 C 106.938 150.019 106.613 150.62 106.267 151.255 C 105.919 151.89 105.56 152.547 105.193 153.225 C 104.821 153.899 104.458 154.561 104.101 155.209 C 103.742 155.858 103.399 156.477 103.071 157.066 C 102.744 157.658 102.454 158.187 102.198 158.651 C 101.938 159.115 101.72 159.501 101.546 159.81 C 101.376 160.123 101.262 160.324 101.206 160.413 C 101.184 160.466 101.152 160.495 101.112 160.502 C 101.067 160.508 101.015 160.512 100.956 160.512 C 100.907 160.512 100.874 160.503 100.855 160.487 C 100.837 160.47 100.817 160.472 100.794 160.492 C 100.738 160.522 100.687 160.52 100.638 160.487 C 100.586 160.458 100.549 160.452 100.527 160.472 C 100.442 160.541 100.377 160.581 100.332 160.591 C 100.284 160.6 100.259 160.562 100.259 160.472 C 100.268 160.301 100.239 160.026 100.177 159.648 C 100.109 159.269 100.017 158.822 99.897 158.305 C 99.779 157.791 99.638 157.23 99.474 156.621 C 99.315 156.016 99.147 155.396 98.968 154.76 C 98.789 154.125 98.611 153.496 98.434 152.874 C 98.259 152.252 98.09 151.673 97.927 151.136 C 97.767 150.603 97.624 150.128 97.498 149.709 C 97.376 149.295 97.281 148.978 97.214 148.757 C 97.095 149.017 96.941 149.371 96.752 149.819 C 96.558 150.266 96.347 150.769 96.117 151.329 C 95.884 151.889 95.64 152.485 95.388 153.116 C 95.131 153.748 94.878 154.374 94.625 154.992 C 94.369 155.614 94.127 156.214 93.901 156.789 C 93.675 157.369 93.472 157.882 93.294 158.33 C 93.119 158.774 92.979 159.138 92.871 159.421 C 92.764 159.7 92.706 159.857 92.699 159.889 C 92.679 159.91 92.659 159.938 92.638 159.973 C 92.615 160.007 92.589 160.044 92.559 160.087 C 92.526 160.133 92.48 160.188 92.42 160.25 C 92.364 160.263 92.32 160.273 92.286 160.28 C 92.252 160.286 92.215 160.289 92.174 160.289 C 92.123 160.316 92.077 160.341 92.036 160.363 C 91.999 160.39 91.965 160.41 91.935 160.423 C 91.902 160.443 91.871 160.459 91.84 160.472 C 91.804 160.508 91.765 160.536 91.724 160.556 C 91.687 160.576 91.65 160.592 91.612 160.606 C 91.594 160.606 91.561 160.599 91.513 160.586 C 91.461 160.573 91.41 160.556 91.362 160.536 C 91.31 160.513 91.262 160.49 91.217 160.467 C 91.172 160.444 91.144 160.419 91.134 160.393 C 91.096 160.298 91.035 160.12 90.95 159.86 C 90.865 159.6 90.762 159.279 90.644 158.897 C 90.525 158.515 90.395 158.081 90.254 157.594 C 90.109 157.11 89.955 156.599 89.792 156.058 C 89.625 155.519 89.456 154.962 89.285 154.39 C 89.111 153.817 88.938 153.248 88.767 152.682 C 88.637 152.238 88.5 151.783 88.355 151.319 C 88.207 150.855 88.06 150.398 87.915 149.946 C 87.767 149.496 87.626 149.064 87.492 148.653 C 87.359 148.245 87.236 147.875 87.124 147.542 C 87.013 147.213 86.918 146.934 86.841 146.703 C 86.762 146.476 86.712 146.322 86.69 146.239 C 86.676 146.176 86.696 146.127 86.752 146.091 C 86.81 146.052 86.875 146.06 86.946 146.116 C 86.998 146.148 87.041 146.152 87.075 146.126 C 87.112 146.099 87.149 146.086 87.186 146.086 C 87.209 146.086 87.246 146.093 87.298 146.105 C 87.346 146.119 87.397 146.134 87.454 146.15 C 87.505 146.167 87.557 146.187 87.609 146.21 C 87.657 146.23 87.698 146.245 87.731 146.259 C 87.761 146.272 87.782 146.275 87.792 146.268 C 87.804 146.262 87.815 146.249 87.826 146.23 C 87.837 146.21 87.849 146.188 87.86 146.165 C 87.874 146.146 87.9 146.129 87.938 146.116 C 88.023 146.09 88.102 146.093 88.177 146.126 C 88.255 146.159 88.325 146.183 88.389 146.2 C 88.433 146.206 88.456 146.201 88.456 146.185 C 88.456 146.165 88.454 146.144 88.45 146.12 C 88.447 146.097 88.45 146.078 88.461 146.061 C 88.472 146.041 88.513 146.037 88.584 146.046 C 88.691 146.046 88.782 146.068 88.856 146.111 C 88.93 146.154 88.997 146.286 89.057 146.506 C 89.071 146.558 89.124 146.723 89.213 147 C 89.302 147.275 89.413 147.63 89.547 148.061 C 89.684 148.492 89.836 148.981 90.003 149.528 C 90.174 150.073 90.353 150.642 90.538 151.23 C 90.72 151.823 90.905 152.417 91.095 153.013 C 91.284 153.612 91.464 154.179 91.635 154.716 C 91.802 155.255 91.954 155.744 92.091 156.182 C 92.225 156.62 92.334 156.976 92.42 157.248 C 92.635 156.873 92.877 156.399 93.144 155.827 C 93.414 155.258 93.694 154.645 93.979 153.99 C 94.264 153.336 94.549 152.666 94.831 151.981 C 95.117 151.293 95.384 150.642 95.632 150.026 C 95.885 149.413 96.108 148.86 96.3 148.368 C 96.494 147.876 96.64 147.501 96.74 147.242 C 96.8 147.086 96.843 146.945 96.869 146.817 C 96.899 146.692 96.936 146.575 96.981 146.467 C 97.029 146.384 97.094 146.292 97.175 146.19 C 97.261 146.084 97.323 146.022 97.364 146.002 C 97.472 145.963 97.561 145.948 97.632 145.957 C 97.706 145.967 97.797 145.982 97.905 146.002 C 97.942 146.009 97.968 146.002 97.983 145.982 C 97.994 145.963 98.003 145.938 98.011 145.908 C 98.018 145.875 98.029 145.842 98.044 145.809 C 98.059 145.774 98.097 145.742 98.161 145.716 C 98.353 145.627 98.472 145.589 98.516 145.602 C 98.561 145.616 98.608 145.701 98.656 145.86 C 98.663 145.895 98.704 146.052 98.778 146.328 C 98.849 146.605 98.944 146.96 99.063 147.394 C 99.185 147.832 99.32 148.334 99.469 148.901 C 99.621 149.466 99.783 150.057 99.954 150.672 C 100.128 151.288 100.303 151.909 100.477 152.534 C 100.647 153.156 100.817 153.745 100.984 154.302 C 101.147 154.857 101.301 155.363 101.446 155.817 C 101.587 156.271 101.707 156.635 101.807 156.908 C 101.908 156.717 102.052 156.455 102.242 156.123 C 102.431 155.787 102.645 155.402 102.882 154.968 C 103.12 154.537 103.382 154.066 103.668 153.556 C 103.953 153.046 104.243 152.522 104.536 151.986 C 104.825 151.446 105.115 150.905 105.405 150.361 C 105.694 149.819 105.967 149.294 106.222 148.786 C 106.475 148.283 106.707 147.811 106.919 147.37 C 107.131 146.929 107.302 146.545 107.432 146.22 C 107.457 146.157 107.497 146.095 107.549 146.031 C 107.604 145.972 107.66 145.916 107.715 145.864 C 107.774 145.815 107.828 145.774 107.876 145.741 C 107.929 145.712 107.962 145.697 107.977 145.697 C 108.036 145.709 108.094 145.726 108.149 145.745 C 108.202 145.768 108.24 145.8 108.267 145.839 C 108.296 145.866 108.312 145.892 108.316 145.919 C 108.32 145.941 108.324 145.963 108.328 145.982 C 108.331 146.002 108.34 146.017 108.356 146.027 C 108.37 146.04 108.402 146.046 108.45 146.046 C 108.528 146.046 108.578 146.063 108.601 146.096 C 108.623 146.129 108.636 146.163 108.64 146.2 C 108.643 146.233 108.646 146.264 108.646 146.294 C 108.646 146.327 108.66 146.336 108.69 146.323 C 108.731 146.323 108.753 146.348 108.756 146.397 C 108.76 146.45 108.762 146.486 108.762 146.506 Z");
    			set_style(path3, "white-space", "pre");
    			attr_dev(path3, "class", "svelte-10j6a2e");
    			add_location(path3, file$6, 0, 79194, 79194);
    			attr_dev(svg, "data-bx-workspace", "master");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:bx", "https://boxy-svg.com");
    			attr_dev(svg, "viewBox", "60 110 75 75");
    			attr_dev(svg, "class", "svelte-10j6a2e");
    			add_location(svg, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Logo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Logo", $$slots, []);
    	return [];
    }

    class Logo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logo",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/Home.svelte generated by Svelte v3.21.0 */

    function create_fragment$9(ctx) {
    	let current;
    	const logo = new Logo({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(logo.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(logo, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(logo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { currentRoute = {} } = $$props;
    	let { params = {} } = $$props;
    	curRoute.set(currentRoute);
    	routeParams.set(params);
    	const writable_props = ["currentRoute", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);

    	$$self.$set = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		curRoute,
    		routeParams,
    		Logo,
    		currentRoute,
    		params
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentRoute, params];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { currentRoute: 0, params: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get currentRoute() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRoute(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/AboutMe.svelte generated by Svelte v3.21.0 */
    const file$7 = "src/components/AboutMe.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let section0;
    	let h30;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let section1;
    	let h31;
    	let t9;
    	let ul;
    	let li0;
    	let t11;
    	let li1;
    	let t13;
    	let li2;
    	let t15;
    	let li3;
    	let t17;
    	let li4;
    	let t19;
    	let li5;
    	let t21;
    	let li6;
    	let t23;
    	let li7;
    	let t25;
    	let li8;
    	let t27;
    	let li9;

    	const block = {
    		c: function create() {
    			div = element("div");
    			section0 = element("section");
    			h30 = element("h3");
    			h30.textContent = "Solver of puzzles, slayer of conundrums.";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "I have an inherent love of deductive logic and distaste for an unsolved puzzle.  Programming is logic given form and function. In my humble opinion, nothing is more beautiful than well-constructed logic in action. I stumbled across a script when I worked for Apple and was able to break it down into its component parts to figure out what it did. From there I started modifying it to make it do different things. Thus began my love affair with programming. And yes my wife is jealous.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "When I am not solving puzzles I am spending time with my beautiful wife and three children. I love to play board games with my ten-year-old and help her with her homework. I also love to play on the floor with my one-year-old twins. As a family, we love to spend time in the great outdoors. We love hiking and camping.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "As a programmer, I love the dynamic of working in a team. Merging disparate coding styles is a challenge that no one who calls themselves a slayer of conundrums could pass up. The group dynamic of balancing each others strengths and weaknesses is a marvelous challenge in and of itself.";
    			t7 = space();
    			section1 = element("section");
    			h31 = element("h3");
    			h31.textContent = "Skills";
    			t9 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "HTML5";
    			t11 = space();
    			li1 = element("li");
    			li1.textContent = "CSS";
    			t13 = space();
    			li2 = element("li");
    			li2.textContent = "JavaScript";
    			t15 = space();
    			li3 = element("li");
    			li3.textContent = "React";
    			t17 = space();
    			li4 = element("li");
    			li4.textContent = "Nodejs";
    			t19 = space();
    			li5 = element("li");
    			li5.textContent = "Svelte";
    			t21 = space();
    			li6 = element("li");
    			li6.textContent = "Enzyme";
    			t23 = space();
    			li7 = element("li");
    			li7.textContent = "Mocha";
    			t25 = space();
    			li8 = element("li");
    			li8.textContent = "Chai";
    			t27 = space();
    			li9 = element("li");
    			li9.textContent = "Jest";
    			add_location(h30, file$7, 10, 8, 223);
    			attr_dev(p0, "class", "svelte-13df4s6");
    			add_location(p0, file$7, 11, 8, 281);
    			attr_dev(p1, "class", "svelte-13df4s6");
    			add_location(p1, file$7, 13, 8, 790);
    			attr_dev(p2, "class", "svelte-13df4s6");
    			add_location(p2, file$7, 14, 8, 1125);
    			attr_dev(section0, "class", "svelte-13df4s6");
    			add_location(section0, file$7, 9, 4, 205);
    			add_location(h31, file$7, 18, 8, 1457);
    			add_location(li0, file$7, 20, 12, 1498);
    			add_location(li1, file$7, 21, 12, 1525);
    			add_location(li2, file$7, 22, 12, 1550);
    			add_location(li3, file$7, 23, 12, 1582);
    			add_location(li4, file$7, 24, 12, 1609);
    			add_location(li5, file$7, 25, 12, 1637);
    			add_location(li6, file$7, 26, 12, 1665);
    			add_location(li7, file$7, 27, 12, 1693);
    			add_location(li8, file$7, 28, 12, 1720);
    			add_location(li9, file$7, 29, 12, 1746);
    			attr_dev(ul, "class", "svelte-13df4s6");
    			add_location(ul, file$7, 19, 8, 1481);
    			attr_dev(section1, "class", "svelte-13df4s6");
    			add_location(section1, file$7, 17, 4, 1439);
    			attr_dev(div, "class", "svelte-13df4s6");
    			add_location(div, file$7, 8, 0, 195);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, section0);
    			append_dev(section0, h30);
    			append_dev(section0, t1);
    			append_dev(section0, p0);
    			append_dev(section0, t3);
    			append_dev(section0, p1);
    			append_dev(section0, t5);
    			append_dev(section0, p2);
    			append_dev(div, t7);
    			append_dev(div, section1);
    			append_dev(section1, h31);
    			append_dev(section1, t9);
    			append_dev(section1, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t11);
    			append_dev(ul, li1);
    			append_dev(ul, t13);
    			append_dev(ul, li2);
    			append_dev(ul, t15);
    			append_dev(ul, li3);
    			append_dev(ul, t17);
    			append_dev(ul, li4);
    			append_dev(ul, t19);
    			append_dev(ul, li5);
    			append_dev(ul, t21);
    			append_dev(ul, li6);
    			append_dev(ul, t23);
    			append_dev(ul, li7);
    			append_dev(ul, t25);
    			append_dev(ul, li8);
    			append_dev(ul, t27);
    			append_dev(ul, li9);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { currentRoute = {} } = $$props;
    	let { params = {} } = $$props;
    	curRoute.set(currentRoute);
    	routeParams.set(params);
    	const writable_props = ["currentRoute", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AboutMe> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AboutMe", $$slots, []);

    	$$self.$set = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		curRoute,
    		routeParams,
    		currentRoute,
    		params
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentRoute, params];
    }

    class AboutMe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { currentRoute: 0, params: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AboutMe",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get currentRoute() {
    		throw new Error("<AboutMe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRoute(value) {
    		throw new Error("<AboutMe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<AboutMe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<AboutMe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const projects = [
        {
            id: 0,
            screenShot: "Question.png",
            name: "Quiz App",
            live: "https://tailrin.github.io/quiz-app",
            repo: "https://github.com/tailrin/quiz-app",
            tech: ["Javascript", "Jquery", "html", "css"],
            description: "This app is a simple quiz of the state capitals. 15 of the 50 states will be randomly chosen to be asked about. This quiz would be great for kids who are studying United States geography.",
            next: 1,
            previous: 3
        },
        {
            id: 1,
            screenShot: "beer.png",
            name: "Brewery App",
            live: "https://tailrin.github.io/brewery-app/",
            repo: "https://github.com/tailrin/brewery-app",
            tech: ["Javascript", "Jquery", "html", "css"],
            description: "This a search engine for breweries. This app is good for people looking for things to do in a specific area and find some good beer in the process.",
            next: 2,
            previous: 0
        },
        {
            id: 2,
            screenShot: "bugTrapper.png",
            name: "Bug Trapper",
            live: "https://bug-trapper-client.now.sh",
            repo: "https://github.com/tailrin/bug-trapper-client",
            tech: ["Javascript", "node", "postgre", "html", "css", "react"],
            description: "This app is an issue tracker for software development. You can track projects and and log issues as well as keep track of the work done on those issues",
            next: 3,
            previous: 1
        },
        {
            id: 3,
            screenShot: "projectTracker.png",
            name: "Project Tracker",
            live: "https://project-tracker.now.sh/",
            repo: "https://github.com/tailrin/project-tracker-client",
            tech: ["Javascript", "node", "postgre", "html", "css", "react"],
            description: "This a a collaborative project tracker designed for use by companies. You can create and prioritize projects, track tasks and assign priority.",
            next: 0,
            previous: 2
        }
    ];

    /* src/components/LeftArrow.svelte generated by Svelte v3.21.0 */

    const file$8 = "src/components/LeftArrow.svelte";

    function create_fragment$b(ctx) {
    	let svg;
    	let defs;
    	let path;
    	let g3;
    	let g2;
    	let g1;
    	let use0;
    	let g0;
    	let use1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			path = svg_element("path");
    			g3 = svg_element("g");
    			g2 = svg_element("g");
    			g1 = svg_element("g");
    			use0 = svg_element("use");
    			g0 = svg_element("g");
    			use1 = svg_element("use");
    			attr_dev(path, "d", "M7.59 0.69C7.91 0.28 8.43 0.28 8.75 0.69C8.82 0.79 9.44 1.58 9.52 1.68C9.84 2.1 9.84 2.76 9.52 3.17C9.17 3.63 7.42 5.89 4.27 9.97C7.42 14.05 9.17 16.32 9.52 16.77C9.84 17.18 9.84 17.85 9.52 18.26C9.44 18.36 8.82 19.16 8.75 19.26C8.43 19.67 7.91 19.67 7.59 19.26C6.93 18.4 1.63 11.57 0.96 10.72C0.64 10.31 0.64 9.64 0.96 9.23C2.29 7.52 6.93 1.54 7.59 0.69Z");
    			attr_dev(path, "id", "agkMISLnN");
    			add_location(path, file$8, 4, 8, 198);
    			add_location(defs, file$8, 3, 4, 183);
    			xlink_attr(use0, "xlink:href", "#agkMISLnN");
    			attr_dev(use0, "opacity", "1");
    			attr_dev(use0, "fill", "#4a4744");
    			attr_dev(use0, "fill-opacity", "1");
    			add_location(use0, file$8, 9, 16, 651);
    			xlink_attr(use1, "xlink:href", "#agkMISLnN");
    			attr_dev(use1, "opacity", "1");
    			attr_dev(use1, "fill-opacity", "0");
    			attr_dev(use1, "stroke", "#000000");
    			attr_dev(use1, "stroke-width", "1");
    			attr_dev(use1, "stroke-opacity", "0");
    			add_location(use1, file$8, 11, 20, 771);
    			add_location(g0, file$8, 10, 16, 747);
    			add_location(g1, file$8, 8, 12, 631);
    			add_location(g2, file$8, 7, 8, 615);
    			add_location(g3, file$8, 6, 4, 603);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "preserveAspectRatio", "xMidYMid meet");
    			attr_dev(svg, "viewBox", "0 0 20 40");
    			attr_dev(svg, "width", "20");
    			attr_dev(svg, "height", "40");
    			add_location(svg, file$8, 2, 0, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, path);
    			append_dev(svg, g3);
    			append_dev(g3, g2);
    			append_dev(g2, g1);
    			append_dev(g1, use0);
    			append_dev(g1, g0);
    			append_dev(g0, use1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LeftArrow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("LeftArrow", $$slots, []);
    	return [];
    }

    class LeftArrow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LeftArrow",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/RightArrow.svelte generated by Svelte v3.21.0 */

    const file$9 = "src/components/RightArrow.svelte";

    function create_fragment$c(ctx) {
    	let svg;
    	let defs;
    	let path;
    	let g3;
    	let g2;
    	let g1;
    	let use0;
    	let g0;
    	let use1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			path = svg_element("path");
    			g3 = svg_element("g");
    			g2 = svg_element("g");
    			g1 = svg_element("g");
    			use0 = svg_element("use");
    			g0 = svg_element("g");
    			use1 = svg_element("use");
    			attr_dev(path, "d", "M2.89 19.26C2.57 19.67 2.06 19.67 1.74 19.26C1.66 19.16 1.04 18.36 0.96 18.26C0.64 17.85 0.64 17.18 0.96 16.77C1.31 16.32 3.06 14.05 6.21 9.97C3.06 5.89 1.31 3.63 0.96 3.17C0.64 2.76 0.64 2.1 0.96 1.68C1.04 1.58 1.66 0.79 1.74 0.69C2.06 0.28 2.57 0.28 2.89 0.69C3.56 1.54 8.86 8.37 9.52 9.23C9.84 9.64 9.84 10.31 9.52 10.72C8.2 12.43 3.56 18.4 2.89 19.26Z");
    			attr_dev(path, "id", "bhnzkD2cW");
    			add_location(path, file$9, 4, 8, 198);
    			add_location(defs, file$9, 3, 4, 183);
    			xlink_attr(use0, "xlink:href", "#bhnzkD2cW");
    			attr_dev(use0, "opacity", "1");
    			attr_dev(use0, "fill", "#4a4744");
    			attr_dev(use0, "fill-opacity", "1");
    			add_location(use0, file$9, 9, 16, 651);
    			xlink_attr(use1, "xlink:href", "#bhnzkD2cW");
    			attr_dev(use1, "opacity", "1");
    			attr_dev(use1, "fill-opacity", "0");
    			attr_dev(use1, "stroke", "#000000");
    			attr_dev(use1, "stroke-width", "1");
    			attr_dev(use1, "stroke-opacity", "0");
    			add_location(use1, file$9, 11, 20, 771);
    			add_location(g0, file$9, 10, 16, 747);
    			add_location(g1, file$9, 8, 12, 631);
    			add_location(g2, file$9, 7, 8, 615);
    			add_location(g3, file$9, 6, 4, 603);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "preserveAspectRatio", "xMidYMid meet");
    			attr_dev(svg, "viewBox", "0 0 20 40");
    			attr_dev(svg, "width", "20");
    			attr_dev(svg, "height", "40");
    			add_location(svg, file$9, 2, 0, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, path);
    			append_dev(svg, g3);
    			append_dev(g3, g2);
    			append_dev(g2, g1);
    			append_dev(g1, use0);
    			append_dev(g1, g0);
    			append_dev(g0, use1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RightArrow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RightArrow", $$slots, []);
    	return [];
    }

    class RightArrow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RightArrow",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/components/Projects.svelte generated by Svelte v3.21.0 */
    const file$a = "src/components/Projects.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (35:8) {#each projects as project, i}
    function create_each_block_1(ctx) {
    	let label;
    	let t0;
    	let t1_value = /*i*/ ctx[10] + 1 + "";
    	let t1;
    	let label_for_value;
    	let t2;
    	let input;
    	let input_value_value;
    	let input_id_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t0 = text("Select project ");
    			t1 = text(t1_value);
    			t2 = space();
    			input = element("input");
    			attr_dev(label, "for", label_for_value = `project-${/*i*/ ctx[10] + 1}`);
    			attr_dev(label, "class", "svelte-1d4wgkj");
    			add_location(label, file$a, 35, 12, 829);
    			attr_dev(input, "type", "radio");
    			input.__value = input_value_value = /*i*/ ctx[10];
    			input.value = input.__value;
    			attr_dev(input, "id", input_id_value = `project-${/*i*/ ctx[10] + 1}`);
    			attr_dev(input, "class", "svelte-1d4wgkj");
    			/*$$binding_groups*/ ctx[7][0].push(input);
    			add_location(input, file$a, 36, 12, 903);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, input, anchor);
    			input.checked = input.__value === /*selected*/ ctx[0];
    			if (remount) dispose();
    			dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[6]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selected*/ 1) {
    				input.checked = input.__value === /*selected*/ ctx[0];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(input);
    			/*$$binding_groups*/ ctx[7][0].splice(/*$$binding_groups*/ ctx[7][0].indexOf(input), 1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(35:8) {#each projects as project, i}",
    		ctx
    	});

    	return block;
    }

    // (59:12) {:else}
    function create_else_block$1(ctx) {
    	let li;
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			if (img.src !== (img_src_value = `/images/${/*tech*/ ctx[8]}.svg`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = `${/*tech*/ ctx[8]} icon`);
    			add_location(img, file$a, 59, 33, 1821);
    			attr_dev(li, "class", "icon svelte-1d4wgkj");
    			add_location(li, file$a, 59, 16, 1804);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedProject*/ 2 && img.src !== (img_src_value = `/images/${/*tech*/ ctx[8]}.svg`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*selectedProject*/ 2 && img_alt_value !== (img_alt_value = `${/*tech*/ ctx[8]} icon`)) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(59:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (57:12) {#if i > 0}
    function create_if_block$2(ctx) {
    	let li;
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			if (img.src !== (img_src_value = `/images/${/*tech*/ ctx[8]}.svg`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = `${/*tech*/ ctx[8]} icon`);
    			add_location(img, file$a, 57, 39, 1707);
    			attr_dev(li, "class", "icon right svelte-1d4wgkj");
    			add_location(li, file$a, 57, 16, 1684);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedProject*/ 2 && img.src !== (img_src_value = `/images/${/*tech*/ ctx[8]}.svg`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*selectedProject*/ 2 && img_alt_value !== (img_alt_value = `${/*tech*/ ctx[8]} icon`)) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(57:12) {#if i > 0}",
    		ctx
    	});

    	return block;
    }

    // (55:8) {#each selectedProject.tech as tech, i}
    function create_each_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[10] > 0) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(55:8) {#each selectedProject.tech as tech, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let section;
    	let ul0;
    	let t0;
    	let h2;
    	let t1_value = /*selectedProject*/ ctx[1].name + "";
    	let t1;
    	let t2;
    	let div0;
    	let button0;
    	let t3;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t4;
    	let button1;
    	let t5;
    	let div1;
    	let a0;
    	let t6;
    	let a0_href_value;
    	let t7;
    	let a1;
    	let t8;
    	let a1_href_value;
    	let t9;
    	let p;
    	let t10_value = /*selectedProject*/ ctx[1].description + "";
    	let t10;
    	let t11;
    	let h3;
    	let t13;
    	let ul1;
    	let current;
    	let dispose;
    	let each_value_1 = projects;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const leftarrow = new LeftArrow({ $$inline: true });
    	const rightarrow = new RightArrow({ $$inline: true });
    	let each_value = /*selectedProject*/ ctx[1].tech;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			create_component(leftarrow.$$.fragment);
    			t3 = space();
    			img = element("img");
    			t4 = space();
    			button1 = element("button");
    			create_component(rightarrow.$$.fragment);
    			t5 = space();
    			div1 = element("div");
    			a0 = element("a");
    			t6 = text("Live App");
    			t7 = space();
    			a1 = element("a");
    			t8 = text("Repo");
    			t9 = space();
    			p = element("p");
    			t10 = text(t10_value);
    			t11 = space();
    			h3 = element("h3");
    			h3.textContent = "Technologies Used";
    			t13 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul0, "class", "svelte-1d4wgkj");
    			add_location(ul0, file$a, 33, 4, 773);
    			add_location(h2, file$a, 39, 4, 1009);
    			attr_dev(button0, "class", "svelte-1d4wgkj");
    			add_location(button0, file$a, 41, 8, 1075);
    			if (img.src !== (img_src_value = `/images/${/*selectedProject*/ ctx[1].screenShot}`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "screenshot svelte-1d4wgkj");
    			attr_dev(img, "alt", img_alt_value = /*selectedProject*/ ctx[1].name);
    			add_location(img, file$a, 42, 8, 1154);
    			attr_dev(button1, "class", "svelte-1d4wgkj");
    			add_location(button1, file$a, 43, 8, 1260);
    			attr_dev(div0, "class", "wrapper svelte-1d4wgkj");
    			add_location(div0, file$a, 40, 4, 1045);
    			attr_dev(a0, "href", a0_href_value = /*selectedProject*/ ctx[1].live);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "svelte-1d4wgkj");
    			add_location(a0, file$a, 47, 8, 1362);
    			attr_dev(a1, "href", a1_href_value = /*selectedProject*/ ctx[1].repo);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "svelte-1d4wgkj");
    			add_location(a1, file$a, 48, 8, 1430);
    			attr_dev(div1, "class", "svelte-1d4wgkj");
    			add_location(div1, file$a, 46, 4, 1348);
    			attr_dev(p, "class", "svelte-1d4wgkj");
    			add_location(p, file$a, 50, 4, 1501);
    			add_location(h3, file$a, 51, 4, 1542);
    			attr_dev(ul1, "class", "svelte-1d4wgkj");
    			add_location(ul1, file$a, 52, 4, 1573);
    			attr_dev(section, "class", "svelte-1d4wgkj");
    			add_location(section, file$a, 32, 0, 759);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, section, anchor);
    			append_dev(section, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			append_dev(section, t0);
    			append_dev(section, h2);
    			append_dev(h2, t1);
    			append_dev(section, t2);
    			append_dev(section, div0);
    			append_dev(div0, button0);
    			mount_component(leftarrow, button0, null);
    			append_dev(div0, t3);
    			append_dev(div0, img);
    			append_dev(div0, t4);
    			append_dev(div0, button1);
    			mount_component(rightarrow, button1, null);
    			append_dev(section, t5);
    			append_dev(section, div1);
    			append_dev(div1, a0);
    			append_dev(a0, t6);
    			append_dev(div1, t7);
    			append_dev(div1, a1);
    			append_dev(a1, t8);
    			append_dev(section, t9);
    			append_dev(section, p);
    			append_dev(p, t10);
    			append_dev(section, t11);
    			append_dev(section, h3);
    			append_dev(section, t13);
    			append_dev(section, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", prevent_default(/*handlePrevious*/ ctx[2]), false, true, false),
    				listen_dev(button1, "click", prevent_default(/*handleNext*/ ctx[3]), false, true, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected*/ 1) {
    				each_value_1 = projects;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if ((!current || dirty & /*selectedProject*/ 2) && t1_value !== (t1_value = /*selectedProject*/ ctx[1].name + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty & /*selectedProject*/ 2 && img.src !== (img_src_value = `/images/${/*selectedProject*/ ctx[1].screenShot}`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*selectedProject*/ 2 && img_alt_value !== (img_alt_value = /*selectedProject*/ ctx[1].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (!current || dirty & /*selectedProject*/ 2 && a0_href_value !== (a0_href_value = /*selectedProject*/ ctx[1].live)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (!current || dirty & /*selectedProject*/ 2 && a1_href_value !== (a1_href_value = /*selectedProject*/ ctx[1].repo)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if ((!current || dirty & /*selectedProject*/ 2) && t10_value !== (t10_value = /*selectedProject*/ ctx[1].description + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*selectedProject*/ 2) {
    				each_value = /*selectedProject*/ ctx[1].tech;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(leftarrow.$$.fragment, local);
    			transition_in(rightarrow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(leftarrow.$$.fragment, local);
    			transition_out(rightarrow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks_1, detaching);
    			destroy_component(leftarrow);
    			destroy_component(rightarrow);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { currentRoute = {} } = $$props;
    	let { params = {} } = $$props;
    	curRoute.set(currentRoute);
    	routeParams.set(params);
    	let selected = 0;
    	let selectedProject = {};

    	function handlePrevious() {
    		if (selected === 0) {
    			$$invalidate(0, selected = projects.length - 1);
    			return;
    		}

    		$$invalidate(0, selected--, selected);
    	}

    	function handleNext() {
    		if (selected === projects.length - 1) {
    			$$invalidate(0, selected = 0);
    			return;
    		}

    		$$invalidate(0, selected++, selected);
    	}

    	const writable_props = ["currentRoute", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Projects", $$slots, []);
    	const $$binding_groups = [[]];

    	function input_change_handler() {
    		selected = this.__value;
    		$$invalidate(0, selected);
    	}

    	$$self.$set = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(4, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(5, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		curRoute,
    		routeParams,
    		projects,
    		LeftArrow,
    		RightArrow,
    		currentRoute,
    		params,
    		selected,
    		selectedProject,
    		handlePrevious,
    		handleNext
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(4, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(5, params = $$props.params);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("selectedProject" in $$props) $$invalidate(1, selectedProject = $$props.selectedProject);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selected*/ 1) {
    			 {
    				$$invalidate(1, selectedProject = projects[selected]);
    			}
    		}
    	};

    	return [
    		selected,
    		selectedProject,
    		handlePrevious,
    		handleNext,
    		currentRoute,
    		params,
    		input_change_handler,
    		$$binding_groups
    	];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { currentRoute: 4, params: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get currentRoute() {
    		throw new Error("<Projects>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRoute(value) {
    		throw new Error("<Projects>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Projects>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Projects>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const routes = [
        {
            name: "/",
            component: Home
        },
        {
            name: "about",
            component: AboutMe
        },
        {
            name: "projects",
            component: Projects
        }
    ];

    /* src/App.svelte generated by Svelte v3.21.0 */
    const file$b = "src/App.svelte";

    function create_fragment$e(ctx) {
    	let t0;
    	let t1;
    	let main;
    	let current;
    	const header = new Header({ $$inline: true });
    	const navbar = new NavBar({ $$inline: true });
    	const router = new src_6({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			create_component(navbar.$$.fragment);
    			t1 = space();
    			main = element("main");
    			create_component(router.$$.fragment);
    			attr_dev(main, "class", "svelte-15f3rnh");
    			add_location(main, file$b, 10, 0, 220);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(navbar.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(navbar.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Header, NavBar, Router: src_6, routes });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

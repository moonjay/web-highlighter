/**
 * the HighlightRange Class（HRange）
 * It's a special object called HRange in Highlighter,
 * represents for a piece of chosen dom
 */

import HighlightSource from '../source/index';
import {DomNode, ERROR, HookMap} from '@src/types';
import {getDomRange, removeSelection} from './selection';
import Hook from '@src/util/hook';
import uuid from '@src/util/uuid';
import {getDomMeta} from './dom';
import { eventEmitter, INTERNAL_ERROR_EVENT } from '@src/util/const';

class HighlightRange {
    start: DomNode;
    end: DomNode;
    text: string;
    id: string;
    frozen: boolean;

    static removeDomRange = removeSelection;

    static fromSelection(idHook: Hook) {
        const range = getDomRange();
        if (!range) {
            return null;
        }

        const start: DomNode = {
            $node: range.startContainer,
            offset: range.startOffset
        };
        const end: DomNode = {
            $node: range.endContainer,
            offset: range.endOffset
        }

        const text = range.toString();
        let id = idHook.call(start, end, text);
        id = id !== undefined && id !== null ? id : uuid();

        return new HighlightRange(start, end, text, id);
    }

    constructor(
        start: DomNode,
        end: DomNode,
        text: string,
        id: string,
        frozen: boolean = false
    ) {
        if (start.$node.nodeType !== 3 || end.$node.nodeType !== 3) {
            eventEmitter.emit(INTERNAL_ERROR_EVENT, {
                type: ERROR.RANGE_NODE_INVALID
            });
        }

        this.start = start;
        this.end = end;
        this.text = text;
        this.frozen = frozen;
        this.id = id;
    }

    // serialize the HRange instance
    // so that you can save the returned object (e.g. use JSON.stringify on it and send to backend)
    serialize($root: HTMLElement | Document, hooks: HookMap): HighlightSource {
        const startMeta = getDomMeta(this.start.$node as Text, this.start.offset, $root);
        const endMeta = getDomMeta(this.end.$node as Text, this.end.offset, $root);

        let extra;
        if (!hooks.Serialize.RecordInfo.isEmpty()) {
            extra = hooks.Serialize.RecordInfo.call(this.start, this.end, $root);
        }

        this.frozen = true;
        return new HighlightSource(startMeta, endMeta, this.text, this.id, extra);
    }
}

export default HighlightRange;
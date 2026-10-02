/**
 * Ask Ambedkar — Core Domain Module
 * 
 * Re-exports domain subsystems to keep architectural boundaries clean
 * and independently testable without coupling to UI or HTTP transport.
 */

export * as Sources from './sources';
export * as Passages from './passages';
export * as Provenance from './provenance';
export * as QuestionProcessing from './question_processing';
export * as Retrieval from './retrieval';
export * as Evidence from './evidence';
export * as Answers from './answers';
export * as Multilingual from './multilingual';
export * as Sessions from './sessions';
export * as Chat from './chat';

import { forEach } from 'lodash-es';
import {
  RECEIVE_WIKIDATA_LABELS,
  RECEIVE_COURSE_WIKIDATA_LABELS,
  ADD_COURSE_WIKIDATA_LABEL,
  REMOVE_COURSE_WIKIDATA_LABEL,
} from '../constants';

const initialState = {
  labels: {},
  courseLabels: [],
};

export default function wikidataLabels(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_WIKIDATA_LABELS: {
      const newLabels = { ...state.labels };
      forEach(action.data.entities, (entity) => {
        if (!entity.labels) { return; }
        const label = entity.labels[action.language] || entity.labels.mul || entity.labels.en;
        if (!label) { return; }
        newLabels[entity.id] = label.value;
      });
      return { ...state, labels: newLabels };
    }
    case RECEIVE_COURSE_WIKIDATA_LABELS:
      return { ...state, courseLabels: action.data.labels || [] };
    case ADD_COURSE_WIKIDATA_LABEL: {
      const added = action.data.label;
      const already = state.courseLabels.some(l => l.match === added.match);
      if (already) return state;
      return { ...state, courseLabels: [...state.courseLabels, added] };
    }
    case REMOVE_COURSE_WIKIDATA_LABEL:
      return {
        ...state,
        courseLabels: state.courseLabels.filter(l => l.match !== action.data.qNumber),
      };
    default:
      return state;
  }
}

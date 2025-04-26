import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";

export namespace Route {
  export type MetaArgs = Parameters<MetaFunction>[0];
  export type LoaderArgs = LoaderFunctionArgs;
  export type ActionArgs = ActionFunctionArgs;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  aiMarkdownContent: string;
  url: string;
  isFavorite: boolean;
  comment: string;
  coverImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticlesResponse {
  items: Article[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface AboutUnit {
    title: string;
    url: string;
    /** 展示用图标地址，缺省时用 url（如技术栈的 skill-icons 图标即存于 url） */
    icon?: string;
    description?: string;
}

export interface AboutColumn {
    title: string;
    item: AboutUnit[];
}

export interface AboutGroup {
    title: string;
    item: AboutColumn[],
}

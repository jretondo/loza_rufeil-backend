import fs from 'fs';
import { Request, Response } from 'express';

interface propRes {
    req: Request,
    res: Response,
    status?: number,
    message?: any
}

export const success = (props: propRes) => {
    props.res.status(props.status || 200).send({
        error: false,
        status: props.status || 200,
        body: props.message || ""
    });
};

export const error = (props: propRes) => {
    props.res.status(props.status || 500).send({
        error: true,
        status: props.status || 500,
        body: props.message || ""
    });
};

export const file = (
    req: Request,
    res: Response,
    filePath: string,
    contentType: string,
    fileName: string,
    data?: object
) => {
    let file = fs.createReadStream(filePath);
    let stat = fs.statSync(filePath);

    data && res.setHeader('dataJson', JSON.stringify(data));
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
    file.pipe(res);
};
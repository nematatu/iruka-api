#!/bin/bash

name="iruka"

lambda_deploy() {
        
    # ファイル名が未指定の場合は処理を中断します。
    if [ $# -lt 1 ]; then
        echo "デプロイしたいファイル名を指定しましょう Usage: ./utils.sh lambda_deploy <FILENAME>"
        exit 1
    fi
    
    filename=$1
    
    if [ "$(ls lambda/iruka | grep -x "${filename}")" ]; then

        echo "関数${filename}の処理を開始します"
    else
        # 指定したファイル名が存在しない場合は処理を中断します。
        echo "${filename}はlambda/配下に存在しないようです 存在するファイル名を指定しましょう"
        exit 1
    fi
    
    cd lambda/iruka
    funame=$(echo $filename | sed s/.mjs//)
    aws lambda get-function --function-name $funame > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        # functionが存在している時
        echo "関数${funame}の内容を更新します"
        zip -r ${funame}.zip ${filename}
        aws lambda update-function-code  --function-name ${funame} \
        --zip-file fileb://${funame}.zip
        rm ${funame}.zip
            
    else
        # functionが存在していない時
        echo "関数${funame}のデプロイを開始します"
        zip -r ${funame}.zip ${filename}
        aws lambda create-function  --function-name ${funame} \
        --runtime nodejs20.x \
        --role arn:aws:iam::940086332249:role/FitBeyond-role \
        --handler ${funame}.handler  --zip-file fileb://${funame}.zip \
        --region ap-northeast-1
        rm ${funame}.zip
    fi
    cd ..
    
}

lambda_deploy_all(){

    for lambdaf in lambda/iruka/*.mjs
    do
        # lambda_deployはファイル名を引数として受け取る想定のため、不要な"lambda/"を取り除いています
        
        filename=$(echo $lambdaf | sed "s|lambda/iruka/||")
        echo $filename
        lambda_deploy $filename
        cd ..
    done
    cd ..
}

case $1 in
    lambda_deploy_all) lambda_deploy_all;;
    lambda_deploy) lambda_deploy $2;;
esac

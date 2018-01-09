let bodyParser = require('body-parser');
let mysqlLocal = require('../dbconfig/configLocal').poolLocal;
let mysqlCloud = require('../dbconfig/configCloud').poolCloud;  //  we're going to cloud
let Promise = require('bluebird');
let moment = require('moment');
let xlsx = require('xlsx');
let async = require('async');

module.exports = function(app){
    //  use bodyParser to parse out json with limit of 50mb
    app.use(bodyParser.json({limit: '50mb'}));
    //  make sure it can handle url request
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));
    //  uploader api
    app.post('/api/upload', function(req, res){
        let post_xlf = req.body;  //  parse json from client 
        let xlf_proposed_obj = [];   //  cleaned obj going to db
        let xlf_barcode_obj = [];   //  "   "   "   "
        
        if(!post_xlf){  //  post_xlf must have xl data
            res.send(JSON.stringify('Upload the required CofA file'));
        } else {

            function form_details(){ // promise function for header
                return new Promise(function(resolve, reject){

                    //  make sure no null here
                    if(typeof post_xlf.header[0]['value'] !== 'undefined' && post_xlf.header[0]['value'] !== null || typeof post_xlf.header[1]['value'] !== 'undefined' && post_xlf.header[1]['value'] !== null || typeof post_xlf.header[2]['value'] !== 'undefined' && post_xlf.header[2]['value'] !== null) {

                        let form_details_obj = [];
                        let dDate = post_xlf.header[1]['value'];

                        //  [0] - order no
                        //  [1] - delivery date
                        //  [2] - supplier id
                        form_details_obj.push({
                            supplier_id: post_xlf.header[2]['value'],
                            delivery_date:  moment(new Date(dDate)).format('YYYY-MM-DD H:mm:ss'),
                            order_no:   post_xlf.header[0]['value']
                        });

                        //  check existing order no
                        mysqlCloud.getConnection(function(err, connection){
                            connection.query({
                                sql: 'SELECT * FROM tbl_proposed_cofa WHERE order_no=?',
                                values:[form_details_obj[0].order_no]
                            },  function(err, results, fields){

                                //  if not undefined resolve the form details obj
                                if(typeof results[0] !== 'undefined' && results[0] !== null){
                                                                        
                                    res.send(JSON.stringify('Invoice already exist'));

                                } else {

                                    //  resolve
                                    resolve(form_details_obj);
                                    //console.log(form_details_obj);
                                }

                            });
                            connection.release();
                        });
                    } else {    // if there's null in the form.. who knows,
                        res.send(JSON.stringify('Cannot find the form details.<br> Please Fill up the form.'));
                    }
                });
            }

            function proposed_cofa(){ // promise function for proposed cofa sheet
                return new Promise(function(resolve, reject){
        
                    //  check if the file has proposed cofa sheet
                    if(typeof post_xlf.xlf['PROPOSED CofA'] !== 'undefined' && post_xlf.xlf['PROPOSED CofA'] !== null && post_xlf.xlf['PROPOSED CofA'].length > 0){
    
                        /*  CLEANING LOOP */
                        for(let i=3;i<post_xlf.xlf['PROPOSED CofA'].length;i++){ // loop through the obj
                            if(typeof post_xlf.xlf['PROPOSED CofA'][i][0] !== 'undefined' && post_xlf.xlf['PROPOSED CofA'][i][0] !== null && post_xlf.xlf['PROPOSED CofA'][i][0] !== ''){
                                current_not_null_obj = [];  // hehe. SORRY for being global. I had to
                                current_not_null_obj.push({ // current obj
                                    ingot_lot_id: post_xlf.xlf['PROPOSED CofA'][i][0],
                                    box_no: post_xlf.xlf['PROPOSED CofA'][i][1],
                                    pallet_no:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][2]),
                                    location:   post_xlf.xlf['PROPOSED CofA'][i][3],
                                    wafer_qty:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][4]),
                                    distance_torm_top:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][5]),
                                    length: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][6]),
                                    top_end_length: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][7]),
                                    MCLT_Top:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][8]),
                                    MCLT_Tail:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][9]),
                                    MCLT_LSL:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][10]),
                                    RES_top:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][11]),
                                    RES_tail:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][12]),
                                    RES_USL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][13]),
                                    RES_LSL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][14]),
                                    OI_top: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][15]),
                                    OI_tail:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][16]),
                                    OI_USL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][17]),
                                    CS_top: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][18]),
                                    CS_tail:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][19]),
                                    CS_USL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][20]),
                                    DIA_ave:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][21]),
                                    DIA_std:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][22]),
                                    DIA_min:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][23]),
                                    DIA_max:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][24]),
                                    DIA_USL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][25]),
                                    DIA_LSL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][26]),
                                    FLAT_width_ave: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][27]),
                                    FLAT_width_std: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][28]),
                                    FLAT_width_min: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][29]),
                                    FLAT_width_max: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][30]),
                                    FLAT_width_USL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][31]),
                                    FLAT_width_LSL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][32]),
                                    FLAT_length_taper1: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][33]),
                                    FLAT_length_taper2: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][34]),
                                    FLAT_length_min:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][35]),
                                    FLAT_length_max:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][36]),
                                    FLAT_length_USL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][37]),
                                    CORNER_length_ave:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][38]),
                                    CORNER_length_std:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][39]),
                                    CORNER_length_min:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][40]),
                                    CORNER_length_max:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][41]),
                                    CORNER_length_USL:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][42]),
                                    CORNER_length_LSL:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][43]),
                                    CENTER_thickness_ave:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][44]),
                                    CENTER_thickness_std:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][45]),
                                    CENTER_thickness_min:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][46]),
                                    CENTER_thickness_max:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][47]),
                                    CENTER_thickness_USL:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][48]),
                                    CENTER_thickness_LSL:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][49]),
                                    TTV_ave:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][50]),
                                    TTV_std:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][51]),
                                    TTV_min:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][52]),
                                    TTV_max:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][53]),
                                    TTV_USL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][54]),
                                    RA_ave: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][55]),
                                    RA_std: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][56]),
                                    RA_min: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][57]),
                                    RA_max: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][58]),
                                    RA_USL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][59]),
                                    RZ_ave: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][60]),
                                    RZ_std: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][61]),
                                    RZ_min: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][62]),
                                    RZ_max: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][63]),
                                    RZ_USL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][64]),
                                    VERTICAL_ave:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][65]),
                                    VERTICAL_std:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][66]),
                                    VERTICAL_min:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][67]),
                                    VERTICAL_max:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][68]),
                                    VERTICAL_USL:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][69]),
                                    VERTICAL_LSL:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][70]),
                                    Copper_content: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][71]) || 0,
                                    Iron_content:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][72]) || 0,
                                    DoesAcceptorReject: post_xlf.xlf['PROPOSED CofA'][i][73]
                                });                 
                                xlf_proposed_obj.push({ //  cleaning obj
                                    ingot_lot_id: post_xlf.xlf['PROPOSED CofA'][i][0],
                                    box_no: post_xlf.xlf['PROPOSED CofA'][i][1],
                                    pallet_no:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][2]),
                                    location:   post_xlf.xlf['PROPOSED CofA'][i][3],
                                    wafer_qty:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][4]),
                                    distance_torm_top:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][5]),
                                    length: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][6]),
                                    top_end_length: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][7]),
                                    MCLT_Top:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][8]),
                                    MCLT_Tail:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][9]),
                                    MCLT_LSL:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][10]),
                                    RES_top:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][11]),
                                    RES_tail:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][12]),
                                    RES_USL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][13]),
                                    RES_LSL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][14]),
                                    OI_top: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][15]),
                                    OI_tail:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][16]),
                                    OI_USL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][17]),
                                    CS_top: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][18]),
                                    CS_tail:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][19]),
                                    CS_USL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][20]),
                                    DIA_ave:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][21]),
                                    DIA_std:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][22]),
                                    DIA_min:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][23]),
                                    DIA_max:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][24]),
                                    DIA_USL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][25]),
                                    DIA_LSL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][26]),
                                    FLAT_width_ave: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][27]),
                                    FLAT_width_std: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][28]),
                                    FLAT_width_min: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][29]),
                                    FLAT_width_max: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][30]),
                                    FLAT_width_USL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][31]),
                                    FLAT_width_LSL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][32]),
                                    FLAT_length_taper1: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][33]),
                                    FLAT_length_taper2: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][34]),
                                    FLAT_length_min:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][35]),
                                    FLAT_length_max:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][36]),
                                    FLAT_length_USL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][37]),
                                    CORNER_length_ave:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][38]),
                                    CORNER_length_std:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][39]),
                                    CORNER_length_min:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][40]),
                                    CORNER_length_max:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][41]),
                                    CORNER_length_USL:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][42]),
                                    CORNER_length_LSL:  parseFloat(post_xlf.xlf['PROPOSED CofA'][i][43]),
                                    CENTER_thickness_ave:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][44]),
                                    CENTER_thickness_std:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][45]),
                                    CENTER_thickness_min:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][46]),
                                    CENTER_thickness_max:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][47]),
                                    CENTER_thickness_USL:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][48]),
                                    CENTER_thickness_LSL:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][49]),
                                    TTV_ave:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][50]),
                                    TTV_std:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][51]),
                                    TTV_min:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][52]),
                                    TTV_max:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][53]),
                                    TTV_USL:    parseFloat(post_xlf.xlf['PROPOSED CofA'][i][54]),
                                    RA_ave: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][55]),
                                    RA_std: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][56]),
                                    RA_min: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][57]),
                                    RA_max: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][58]),
                                    RA_USL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][59]),
                                    RZ_ave: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][60]),
                                    RZ_std: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][61]),
                                    RZ_min: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][62]),
                                    RZ_max: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][63]),
                                    RZ_USL: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][64]),
                                    VERTICAL_ave:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][65]),
                                    VERTICAL_std:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][66]),
                                    VERTICAL_min:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][67]),
                                    VERTICAL_max:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][68]),
                                    VERTICAL_USL:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][69]),
                                    VERTICAL_LSL:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][70]),
                                    Copper_content: parseFloat(post_xlf.xlf['PROPOSED CofA'][i][71]) || 0,
                                    Iron_content:   parseFloat(post_xlf.xlf['PROPOSED CofA'][i][72]) || 0,
                                    DoesAcceptorReject: post_xlf.xlf['PROPOSED CofA'][i][73]
                                });
                            } else {
                                xlf_proposed_obj.push({ // cleaning obj stick to current obj if NULL
                                    ingot_lot_id:   current_not_null_obj[0].ingot_lot_id,
                                    box_no: post_xlf.xlf['PROPOSED CofA'][i][1],
                                    pallet_no:  post_xlf.xlf['PROPOSED CofA'][i][2],
                                    location:   current_not_null_obj[0].location,
                                    wafer_qty:  post_xlf.xlf['PROPOSED CofA'][i][4],
                                    distance_torm_top:  current_not_null_obj[0].distance_torm_top,
                                    length: current_not_null_obj[0].length,
                                    top_end_length: current_not_null_obj[0].top_end_length,
                                    MCLT_Top:   current_not_null_obj[0].MCLT_Top,
                                    MCLT_Tail:  current_not_null_obj[0].MCLT_Tail,
                                    MCLT_LSL:   current_not_null_obj[0].MCLT_LSL,
                                    RES_top:    current_not_null_obj[0].RES_top,
                                    RES_tail:   current_not_null_obj[0].RES_tail,
                                    RES_USL:    current_not_null_obj[0].RES_USL,
                                    RES_LSL:    current_not_null_obj[0].RES_LSL,
                                    OI_top: current_not_null_obj[0].OI_top,
                                    OI_tail:    current_not_null_obj[0].OI_tail,
                                    OI_USL: current_not_null_obj[0].OI_USL,
                                    CS_top: current_not_null_obj[0].CS_top,
                                    CS_tail:    current_not_null_obj[0].CS_tail,
                                    CS_USL: current_not_null_obj[0].CS_USL,
                                    DIA_ave:    current_not_null_obj[0].DIA_ave,
                                    DIA_std:    current_not_null_obj[0].DIA_std,
                                    DIA_min:    current_not_null_obj[0].DIA_min,
                                    DIA_max:    current_not_null_obj[0].DIA_max,
                                    DIA_USL:    current_not_null_obj[0].DIA_USL,
                                    DIA_LSL:    current_not_null_obj[0].DIA_LSL,
                                    FLAT_width_ave: current_not_null_obj[0].FLAT_width_ave,
                                    FLAT_width_std: current_not_null_obj[0].FLAT_width_std,
                                    FLAT_width_min: current_not_null_obj[0].FLAT_width_min,
                                    FLAT_width_max: current_not_null_obj[0].FLAT_width_max,
                                    FLAT_width_USL: current_not_null_obj[0].FLAT_width_USL,
                                    FLAT_width_LSL: current_not_null_obj[0].FLAT_width_LSL,
                                    FLAT_length_taper1: current_not_null_obj[0].FLAT_length_taper1,
                                    FLAT_length_taper2: current_not_null_obj[0].FLAT_length_taper2,
                                    FLAT_length_min:    current_not_null_obj[0].FLAT_length_min,
                                    FLAT_length_max:    current_not_null_obj[0].FLAT_length_max,
                                    FLAT_length_USL:    current_not_null_obj[0].FLAT_length_USL,
                                    CORNER_length_ave:  current_not_null_obj[0].CORNER_length_ave,
                                    CORNER_length_std:  current_not_null_obj[0].CORNER_length_std,
                                    CORNER_length_min:  current_not_null_obj[0].CORNER_length_min,
                                    CORNER_length_max:  current_not_null_obj[0].CORNER_length_max,
                                    CORNER_length_USL:  current_not_null_obj[0].CORNER_length_USL,
                                    CORNER_length_LSL:  current_not_null_obj[0].CORNER_length_LSL,
                                    CENTER_thickness_ave:   current_not_null_obj[0].CENTER_thickness_ave,
                                    CENTER_thickness_std:   current_not_null_obj[0].CENTER_thickness_std,
                                    CENTER_thickness_min:   current_not_null_obj[0].CENTER_thickness_min,
                                    CENTER_thickness_max:   current_not_null_obj[0].CENTER_thickness_max,
                                    CENTER_thickness_USL:   current_not_null_obj[0].CENTER_thickness_USL,
                                    CENTER_thickness_LSL:   current_not_null_obj[0].CENTER_thickness_LSL,
                                    TTV_ave:    current_not_null_obj[0].TTV_ave,
                                    TTV_std:    current_not_null_obj[0].TTV_std,
                                    TTV_min:    current_not_null_obj[0].TTV_min,
                                    TTV_max:    current_not_null_obj[0].TTV_max,
                                    TTV_USL:    current_not_null_obj[0].TTV_USL,
                                    RA_ave: current_not_null_obj[0].RA_ave,
                                    RA_std: current_not_null_obj[0].RA_std,
                                    RA_min: current_not_null_obj[0].RA_min,
                                    RA_max: current_not_null_obj[0].RA_max,
                                    RA_USL: current_not_null_obj[0].RA_USL,
                                    RZ_ave: current_not_null_obj[0].RZ_ave,
                                    RZ_std: current_not_null_obj[0].RZ_std,
                                    RZ_min: current_not_null_obj[0].RZ_min,
                                    RZ_max: current_not_null_obj[0].RZ_max,
                                    RZ_USL: current_not_null_obj[0].RZ_USL,
                                    VERTICAL_ave:   current_not_null_obj[0].VERTICAL_ave,
                                    VERTICAL_std:   current_not_null_obj[0].VERTICAL_std,
                                    VERTICAL_min:   current_not_null_obj[0].VERTICAL_min,
                                    VERTICAL_max:   current_not_null_obj[0].VERTICAL_max,
                                    VERTICAL_USL:   current_not_null_obj[0].VERTICAL_USL,
                                    VERTICAL_LSL:   current_not_null_obj[0].VERTICAL_LSL,
                                    Copper_content: current_not_null_obj[0].Copper_content,
                                    Iron_content:   current_not_null_obj[0].Iron_content,
                                    DoesAcceptorReject: current_not_null_obj[0].DoesAcceptorReject
                                });
                            }
                        }
                        /* end of cleaning */
    
                        //  now that it's clean, resolve!
                        resolve(xlf_proposed_obj);
                    } else { // then res to client upload the required file
                        res.send(JSON.stringify('Error proposed cofa: Upload CofA file with correct template'));
                    }
                });
            }
    
            function ingot_barcode(){ // promise function for barcode sheet
                return new Promise(function(resolve, reject){

                    //  check if the file has ingot lot barcode sheet
                    if(typeof post_xlf.xlf['Ingot Lot Barcodes'] !== 'undefined' && post_xlf.xlf['Ingot Lot Barcodes'] !== null && post_xlf.xlf['Ingot Lot Barcodes'].length > 0){
                        
                        /* CLEANING LOOP */
                        for(let i=1;i<post_xlf.xlf['Ingot Lot Barcodes'].length;i++){
                            if(typeof post_xlf.xlf['Ingot Lot Barcodes'][i][0] !== 'undefined' && post_xlf.xlf['Ingot Lot Barcodes'][i][0] !== null && post_xlf.xlf['Ingot Lot Barcodes'][i][0] !== ''){
                                
                                //  loop per row
                                for(let j=1;j<post_xlf.xlf['Ingot Lot Barcodes'][i].length;j++){
                                    xlf_barcode_obj.push({
                                        ingot_lot_id:   post_xlf.xlf['Ingot Lot Barcodes'][i][0],
                                        ingot_barcode:  post_xlf.xlf['Ingot Lot Barcodes'][i][j]
                                    });
                                }
                            } 
                                /* 1.1 PATCH - Missed row  
                                else { // if there's missing ingot lot # 
                                res.send(JSON.stringify('Error: Missing Ingot Lot # at barcode sheet'));
                                reject('Error: Missing Ingot Lot # at barcode sheet');
                            } */
                        }
                        /* end of cleaning */

                        //  resolve cleaned object
                        resolve(xlf_barcode_obj);
                       // console.log(xlf_barcode_obj);
    
                    } else {    // then res to client upload the required file
                        res.send(JSON.stringify('Error ingot barcode: Upload CofA File with correct template'));
                    }
                });
            }
            /*  just add more function if there's more sheeeets to come */
    
            /* Promise Invoker */
            form_details().then(function(form_details_obj){
                return proposed_cofa().then(function(xlf_proposed_obj){
                    return ingot_barcode().then(function(xlf_barcode_obj){
                        
                        //  preparing for upload proposed cofa sheet
                        for(let i=0;i<xlf_proposed_obj.length;i++){
                            if(typeof xlf_proposed_obj[i].ingot_lot_id !== 'undefined' && xlf_proposed_obj[i].ingot_lot_id !== null && xlf_proposed_obj[i].ingot_lot_id.length > 0){
                                //  to database table tbl_proposed_cofa
                                mysqlCloud.getConnection(function(err,  connection){
                                    connection.query({
                                        sql:'INSERT INTO tbl_proposed_cofa SET ingot_lot_id=?, supplier_id=?, delivery_date=?, order_no=?, box_no=?,pallet_no=?,location=?,wafer_qty=?,distance_torm_top=?,length=?,top_end_length=?,MCLT_Top=?,MCLT_Tail=?,MCLT_LSL=?,RES_top=?,RES_tail=?,RES_USL=?,RES_LSL=?,OI_top=?,OI_tail=?,OI_USL=?,CS_top=?,CS_tail=?,CS_USL=?,DIA_ave=?,DIA_std=?,DIA_min=?,DIA_max=?,DIA_USL=?,DIA_LSL=?,FLAT_width_ave=?,FLAT_width_std=?,FLAT_width_min=?,FLAT_width_max=?,FLAT_width_USL=?,FLAT_width_LSL=?,FLAT_length_taper1=?,FLAT_length_taper2=?,FLAT_length_min=?,FLAT_length_max=?,FLAT_length_USL=?,CORNER_length_ave=?,CORNER_length_std=?,CORNER_length_min=?,CORNER_length_max=?,CORNER_length_USL=?,CORNER_length_LSL=?,CENTER_thickness_ave=?,CENTER_thickness_std=?,CENTER_thickness_min=?,CENTER_thickness_max=?,CENTER_thickness_USL=?,CENTER_thickness_LSL=?,TTV_ave=?,TTV_std=?,TTV_min=?,TTV_max=?,TTV_USL=?,RA_ave=?,RA_std=?,RA_min=?,RA_max=?,RA_USL=?,RZ_ave=?,RZ_std=?,RZ_min=?,RZ_max=?,RZ_USL=?,VERTICAL_ave=?,VERTICAL_std=?,VERTICAL_min=?,VERTICAL_max=?,VERTICAL_USL=?,VERTICAL_LSL=?,Copper_content=?,Iron_content=?,DoesAcceptorReject=?,Upload_time=?',
                                        values: [xlf_proposed_obj[i].ingot_lot_id, form_details_obj[0].supplier_id, form_details_obj[0].delivery_date, form_details_obj[0].order_no, xlf_proposed_obj[i].box_no, xlf_proposed_obj[i].pallet_no, xlf_proposed_obj[i].location, xlf_proposed_obj[i].wafer_qty, xlf_proposed_obj[i].distance_torm_top, xlf_proposed_obj[i].length, xlf_proposed_obj[i].top_end_length, xlf_proposed_obj[i].MCLT_Top, xlf_proposed_obj[i].MCLT_Tail, xlf_proposed_obj[i].MCLT_LSL, xlf_proposed_obj[i].RES_top, xlf_proposed_obj[i].RES_tail, xlf_proposed_obj[i].RES_USL, xlf_proposed_obj[i].RES_LSL, xlf_proposed_obj[i].OI_top, xlf_proposed_obj[i].OI_tail, xlf_proposed_obj[i].OI_USL, xlf_proposed_obj[i].CS_top, xlf_proposed_obj[i].CS_tail, xlf_proposed_obj[i].CS_USL, xlf_proposed_obj[i].DIA_ave, xlf_proposed_obj[i].DIA_std, xlf_proposed_obj[i].DIA_min, xlf_proposed_obj[i].DIA_max, xlf_proposed_obj[i].DIA_USL, xlf_proposed_obj[i].DIA_LSL, xlf_proposed_obj[i].FLAT_width_ave, xlf_proposed_obj[i].FLAT_width_std, xlf_proposed_obj[i].FLAT_width_min, xlf_proposed_obj[i].FLAT_width_max, xlf_proposed_obj[i].FLAT_width_USL, xlf_proposed_obj[i].FLAT_width_LSL, xlf_proposed_obj[i].FLAT_length_taper1, xlf_proposed_obj[i].FLAT_length_taper2, xlf_proposed_obj[i].FLAT_length_min, xlf_proposed_obj[i].FLAT_length_max, xlf_proposed_obj[i].FLAT_length_USL, xlf_proposed_obj[i].CORNER_length_ave, xlf_proposed_obj[i].CORNER_length_std, xlf_proposed_obj[i].CORNER_length_min, xlf_proposed_obj[i].CORNER_length_max, xlf_proposed_obj[i].CORNER_length_USL, xlf_proposed_obj[i].CORNER_length_LSL, xlf_proposed_obj[i].CENTER_thickness_ave, xlf_proposed_obj[i].CENTER_thickness_std, xlf_proposed_obj[i].CENTER_thickness_min, xlf_proposed_obj[i].CENTER_thickness_max, xlf_proposed_obj[i].CENTER_thickness_USL, xlf_proposed_obj[i].CENTER_thickness_LSL, xlf_proposed_obj[i].TTV_ave, xlf_proposed_obj[i].TTV_std, xlf_proposed_obj[i].TTV_min, xlf_proposed_obj[i].TTV_max, xlf_proposed_obj[i].TTV_USL, xlf_proposed_obj[i].RA_ave, xlf_proposed_obj[i].RA_std, xlf_proposed_obj[i].RA_min, xlf_proposed_obj[i].RA_max, xlf_proposed_obj[i].RA_USL, xlf_proposed_obj[i].RZ_ave, xlf_proposed_obj[i].RZ_std, xlf_proposed_obj[i].RZ_min, xlf_proposed_obj[i].RZ_max, xlf_proposed_obj[i].RZ_USL, xlf_proposed_obj[i].VERTICAL_ave, xlf_proposed_obj[i].VERTICAL_std, xlf_proposed_obj[i].VERTICAL_min, xlf_proposed_obj[i].VERTICAL_max, xlf_proposed_obj[i].VERTICAL_USL, xlf_proposed_obj[i].VERTICAL_LSL, xlf_proposed_obj[i].Copper_content, xlf_proposed_obj[i].Iron_content, xlf_proposed_obj[i].DoesAcceptorReject, new Date()] 
                                    },  function(err, results, fields){
                                        if(err){console.log(err)}
                                        //console.log('saved to db!');
                                    });
                                    connection.release(); // don't forget to release! -.-
                                });
            
                            }
                        }
    
                        //  preparing for upload ingot lot barcodes sheet
                        for(let i=0;i<xlf_barcode_obj.length;i++){
                            if(typeof xlf_barcode_obj[i].ingot_lot_id !== 'undefined' && xlf_barcode_obj[i].ingot_lot_id !== null && xlf_barcode_obj[i].ingot_lot_id.length > 0){
    
                                // to database table tbl_ingot_lot_barcode
                                mysqlCloud.getConnection(function(err,  connection){
                                    connection.query({
                                        sql: 'INSERT INTO tbl_ingot_lot_barcodes SET ingot_lot_id=?, supplier_id=?, delivery_date=?, order_no=?, upload_time=?, bundle_barcode=?',
                                        values: [xlf_barcode_obj[i].ingot_lot_id, form_details_obj[0].supplier_id, form_details_obj[0].delivery_date, form_details_obj[0].order_no, new Date(),xlf_barcode_obj[i].ingot_barcode]
                                    },  function(err, results, fields){
                                      //  console.log('saved');
                                    });
                                    connection.release();   // release the kraken
                                });
    
    
                            }
                        }
                        //  send responsed to client
                        res.send(JSON.stringify('Success: File has been uploaded'));
                    });
                });    
            });
            
        }
        
    }); 

    //  barcode lot binder
    app.post('/api/barcode', function(req, res){
        let post_barcode = req.body;

        function cleaner(){ // verify before cleaning
            return new Promise(function(resolve, reject){
                if(!post_barcode){
                    res.send('Please fill up the form properly');
                } else {
                    if(!post_barcode.line){
                        res.send('You can only select line between 17-22');
                    } else {
                        if(!post_barcode.lot_id){
                            res.send('Missing Lot id');
                        } else if (!post_barcode.qty){
                            res.send('Missing Quantity');
                        } else {
                            if(post_barcode.qty > 400 && post_barcode.qty <= 500 ){
                                if(!post_barcode.stack5_id1 || !post_barcode.stack5_id2 || !post_barcode.stack5_id3 || !post_barcode.stack5_id4 || !post_barcode.stack5_id5){
                                    res.send('Incomplete stack ID of 5');
                                } else {
                                    if(post_barcode.stack5_id1.toUpperCase() == post_barcode.stack5_id2.toUpperCase() || post_barcode.stack5_id1.toUpperCase() == post_barcode.stack5_id3.toUpperCase() || post_barcode.stack5_id1.toUpperCase() == post_barcode.stack5_id4.toUpperCase() || post_barcode.stack5_id1.toUpperCase() == post_barcode.stack5_id5.toUpperCase() || post_barcode.stack5_id2.toUpperCase() == post_barcode.stack5_id3.toUpperCase() || post_barcode.stack5_id2.toUpperCase() == post_barcode.stack5_id4.toUpperCase() || post_barcode.stack5_id2.toUpperCase() == post_barcode.stack5_id5.toUpperCase() || post_barcode.stack5_id3.toUpperCase() == post_barcode.stack5_id4.toUpperCase() || post_barcode.stack5_id3.toUpperCase() == post_barcode.stack5_id5.toUpperCase() || post_barcode.stack5_id4.toUpperCase() == post_barcode.stack5_id5.toUpperCase()){
                                        res.send('Duplicate stack ID is not allowed');
                                    } else {
                                        let cleaned_post_barcode = [];
                                        
                                        cleaned_post_barcode.push({
                                            line: post_barcode.line,
                                            lot_id: post_barcode.lot_id,
                                            consume_date: new Date(),
                                            bundle_barcode: [
                                                post_barcode.stack5_id1,
                                                post_barcode.stack5_id2,
                                                post_barcode.stack5_id3,
                                                post_barcode.stack5_id4,
                                                post_barcode.stack5_id5
                                            ] 
                                        });
                                        resolve(cleaned_post_barcode);
                                    }
                                }
                            } else if(post_barcode.qty > 300 && post_barcode.qty <= 400 ){
                                if(!post_barcode.stack4_id1 || !post_barcode.stack4_id2 || !post_barcode.stack4_id3 || !post_barcode.stack4_id4){
                                    res.send('Incomple stack ID of 4');
                                } else {
                                    if(post_barcode.stack4_id1.toUpperCase() == post_barcode.stack4_id2.toUpperCase() || post_barcode.stack4_id1.toUpperCase() == post_barcode.stack4_id3.toUpperCase() || post_barcode.stack4_id1.toUpperCase() == post_barcode.stack4_id4.toUpperCase() || post_barcode.stack4_id2.toUpperCase() == post_barcode.stack4_id3.toUpperCase() || post_barcode.stack4_id2.toUpperCase() == post_barcode.stack4_id4.toUpperCase() || post_barcode.stack4_id3.toUpperCase() == post_barcode.stack4_id4.toUpperCase()){
                                        res.send('Duplicate stack ID is not allowed');
                                    } else {
                                        let cleaned_post_barcode = [];
                                        
                                        cleaned_post_barcode.push({
                                            line: post_barcode.line,
                                            lot_id: post_barcode.lot_id,
                                            consume_date: new Date(),
                                            bundle_barcode: [
                                                post_barcode.stack4_id1,
                                                post_barcode.stack4_id2,
                                                post_barcode.stack4_id3,
                                                post_barcode.stack4_id4
                                            ] 
                                        });
                                        resolve(cleaned_post_barcode);
                                    }
                                }
                            } else if(post_barcode.qty > 200 && post_barcode.qty <= 300 ){
                                if(!post_barcode.stack3_id1 || !post_barcode.stack3_id2 || !post_barcode.stack3_id3 ){
                                    res.send('Incomplete stack ID of 3');
                                } else {
                                    if(post_barcode.stack3_id1.toUpperCase() == post_barcode.stack3_id2.toUpperCase() || post_barcode.stack3_id1.toUpperCase() == post_barcode.stack3_id3.toUpperCase() || post_barcode.stack3_id2.toUpperCase() == post_barcode.stack3_id3.toUpperCase() ){
                                        res.send('Duplicate stack ID is not allowed');
                                    } else {
                                        let cleaned_post_barcode = [];
                                        
                                        cleaned_post_barcode.push({
                                            line: post_barcode.line,
                                            lot_id: post_barcode.lot_id,
                                            consume_date: new Date(),
                                            bundle_barcode: [
                                                post_barcode.stack3_id1,
                                                post_barcode.stack3_id2,
                                                post_barcode.stack3_id3
                                            ] 
                                        });
                                        resolve(cleaned_post_barcode);
                                    }
                                }
                            } else if(post_barcode.qty > 100 && post_barcode.qty <= 200 ){
                                if(!post_barcode.stack2_id1 || !post_barcode.stack2_id2 ){
                                    res.send('Incomple stack ID of 2');
                                } else {
                                    if(post_barcode.stack2_id1.toUpperCase() == post_barcode.stack2_id2.toUpperCase() ){
                                        res.send('Duplicate stack ID is not allowed');
                                    } else {
                                        let cleaned_post_barcode = [];
                                        
                                        cleaned_post_barcode.push({
                                            line: post_barcode.line,
                                            lot_id: post_barcode.lot_id,
                                            consume_date: new Date(),
                                            bundle_barcode: [
                                                post_barcode.stack2_id1,
                                                post_barcode.stack2_id2
                                            ] 
                                        });
                                        resolve(cleaned_post_barcode);
                                    }
                                }
                            } else if(post_barcode.qty <= 100 ){
                                if(!post_barcode.stack1_id1){
                                    res.send('Fill up the stack ID');
                                } else {
                                    let cleaned_post_barcode = [];
                                    
                                    cleaned_post_barcode.push({
                                        line: post_barcode.line,
                                        lot_id: post_barcode.lot_id,
                                        consume_date: new Date(),
                                        bundle_barcode: [
                                            post_barcode.stack1_id1
                                        ] 
                                    });
                                    resolve(cleaned_post_barcode);
                                }
                            }
                        }
                    }
                }
            });
        }

        cleaner().then(function(cleaned_post_barcode){ // injoker

            function doesExist(){
                return new Promise(function(resolve, reject){
                    mysqlCloud.getConnection(function(err, connection){
                        let x = 0; // barcode checker before resolve this saves me after 3 days. solution came to my mind while commuting lol.
                        let doesExist_obj=[];

                        for(let i=0;i<cleaned_post_barcode[0].bundle_barcode.length;i++){
                            connection.query({
                                sql: 'SELECT DISTINCT(bundle_barcode) FROM tbl_ingot_lot_barcodes WHERE bundle_barcode = ?',
                                values: [cleaned_post_barcode[0].bundle_barcode[i]]
                            },  function(err, results, fields){

                                if(typeof results[0] != 'undefined' || results[0] != null){
                                    x++; // increment maybe?

                                    doesExist_obj.push(
                                        results[0].bundle_barcode
                                    );

                                    if(x == cleaned_post_barcode[0].bundle_barcode.length){ // resolve if reached the length
                                        resolve(doesExist_obj);
                                    }

                                } else {

                                    resolve(doesExist_obj);
                                }

                            });
                        }
                    connection.release();
                    });
                });
            }
            

            return doesExist().then(function(doesExist_obj){
                if(doesExist_obj.length == cleaned_post_barcode[0].bundle_barcode.length){
                    
                    function doesNotUsedAlready(){
                        return new Promise(function(resolve, reject){
                            mysqlCloud.getConnection(function(err, connection){
                                let x = 0;
                                let doesNotUsedAlready_obj=[];

                                for(let i=0;i<doesExist_obj.length;i++){
                                    connection.query({
                                        sql: 'SELECT DISTINCT(barcode) FROM tbl_consumed_barcodes WHERE barcode = ?',
                                        values: [doesExist_obj[i]]
                                    },  function(err, results, fields){

                                        if(typeof results[0] == 'undefined' || results[0] == null){
                                            x++;

                                            doesNotUsedAlready_obj.push(
                                                doesExist_obj[i]
                                            );

                                            if(x == doesExist_obj.length){
                                                resolve(doesNotUsedAlready_obj);
                                            }

                                        } else {

                                            resolve(doesNotUsedAlready_obj);
                                        }
                                    });
                                }

                            connection.release();
                            });

                        });
                    }

                    
                    return doesNotUsedAlready().then(function(doesNotUsedAlready_obj){
                        if(doesNotUsedAlready_obj.length == doesExist_obj.length){
                            
                            mysqlCloud.getConnection(function(err, connection){
                                for(let i=0;i<doesNotUsedAlready_obj.length;i++){
                                    connection.query({
                                        sql: 'UPDATE tbl_ingot_lot_barcodes SET consume_date = ?, lot_id = ? WHERE bundle_barcode = ?',
                                        values: [cleaned_post_barcode[0].consume_date, cleaned_post_barcode[0].lot_id, doesNotUsedAlready_obj[i]]
                                    },  function(err, results, fields){
                                    });

                                    connection.query({
                                        sql: 'INSERT INTO tbl_consumed_barcodes SET upload_date = ?, line = ?, lot_id = ?, barcode = ?',
                                        values: [cleaned_post_barcode[0].consume_date, cleaned_post_barcode[0].line, cleaned_post_barcode[0].lot_id, doesNotUsedAlready_obj[i]]
                                    },  function(err, results, fields){
                                    });
                                }
                            connection.release();
                            res.send('Form has been saved!');
                            });
                            
                        } else {
                            res.send('Stack ID already used. Try different Stack ID.');
                        }
                    });
                    
                } else {
                    res.send('Stack ID does not exists. If you believe it is correct, ask Yield team to upload CofA.');
                }
            });
            
        });
        
    });

    //  user registration page
    app.get('/register', function(req, res){

    });

    //  index page
    app.get('/', function(req, res){
        res.redirect('/upload'); // redirect for the meantime
    });

    //  admin page 
    //  try nodemailer here
    app.get('/admin', function(req, res){

    });

    //  operator's page
    app.get('/barcode/:line', function(req, res){
        if(req.params.line == '17' || req.params.line == '18'|| req.params.line == '19' || req.params.line == '20' || req.params.line == '21' || req.params.line == '22'  ){
            res.render('barcode', { line: req.params.line });
        } else {
            res.render('404');
        }
       
    });

    //  get upload page
    app.get('/upload', function(req, res){

        /*
        function querySupplier(){
            return new Promise(function(resolve, reject){

                
            });

        }
        */


        //  get the supplier list
        mysqlCloud.getConnection(function(err, connection){
            connection.query({
                sql: 'SELECT * FROM tbl_supplier_list'
            },  function(err, results, fields){
                let supplier_obj=[];
                    for(let i=0; i<results.length;i++){
                        supplier_obj.push({
                            supplier_id: results[i].supplier_id,
                            supplier_name:  results[i].supplier_name
                        });
                    }
                
            // render the page
            res.render('upload', {supplier_obj});
            });
            connection.release(); // always
        });
    });

}

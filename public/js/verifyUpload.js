$('document').ready(function(){

    /* validation */
    $('#upload_form').validate({
        rules:{
            file: {
                required: true
            }
        },
        messages:{
            xlf: {
                required: "Select CofA Excel file (.xlsx)"
            }
        },
        submitHandler: submitForm
    });
    $('input[name^="xlfile"]').rules('add', {
        required: true,
    });
    /* validation */

    function submitForm(){
        $.ajax({
            type: 'POST',
            url:  '/api/upload',
            data: output,
            contentType: "application/json",
            dataType: 'json',
            beforeSend: function(){
                $('#error').fadeOut();
                $('#btn-upload').prop('disabled', true);
                $('#btn-upload').html('sending ...');
            },
            success: function(response){
                //console.log(response);
                if(response=="Success: File has been uploaded"){
                    
					$("#btn-upload").html('Uploading...');
                    $("#btn-upload").prop("disabled",true);
                    $("#xlf").prop("disabled",true);
                    $("#error").fadeIn(1000, function(){						
                        $("#error").html('<div class="alert alert-success">'+response+' </div>');
                    });
                    setTimeout(' window.location.href="/upload"; ',5000);
                } else {
                    $("#error").fadeIn(1000, function(){						
                        $("#error").html('<div class="alert alert-danger">'+response+' </div>'); 
                        let counter = 10;
                        let interval = setInterval(function(){
                            counter--;
                            $("#btn-upload").html('Please wait in ' + counter + ' secs');

                            if(counter !== 1){
                                $("#btn-upload").html('Please wait in ' + counter + ' secs');
                            } else {
                                $("#btn-upload").html('Please wait in ' + counter + ' sec');
                                clearInterval(interval);
                            }
                        },	1000);

                        setTimeout(function(){
                            $("#btn-upload").prop("disabled",false);
                            $("#btn-upload").html('Try again');
                        }, counter +'000');
                    });
                }
            }
        });
    }

});